<a href="https://colab.research.google.com/github/junaid-pathan/trialforge/blob/main/Hack_Princeton.ipynb" target="_parent"><img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/></a>
!pip install sdv scikit-learn shap captum transformers torch
import pandas as pd
from sdv.single_table import TVAESynthesizer
from sdv.metadata import SingleTableMetadata
from sklearn.model_selection import train_test_split

# 1. Load Real Data (UCI Heart Disease)
url = "https://archive.ics.uci.edu/ml/machine-learning-databases/heart-disease/processed.cleveland.data"
names = ['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach', 'exang', 'oldpeak', 'slope', 'ca', 'thal', 'target']
data = pd.read_csv(url, names=names, na_values='?').fillna(0)
data['target'] = (data['target'] > 0).astype(int) # Binary classification

# 2. Step A: The Split (Teacher vs. Judge)
real_a, real_b = train_test_split(data, test_size=0.5, random_state=42)

# 3. Step B: Training the TVAE Synthesizer
metadata = SingleTableMetadata()
metadata.detect_from_dataframe(data=real_a)

# Fast training for the hackathon
synthesizer = TVAESynthesizer(metadata, epochs=300, enable_gpu=True)
synthesizer.fit(real_a)

# 4. Generate the Digital Twins
synthetic_a = synthesizer.sample(num_rows=len(real_a))
print("Digital Twins successfully generated!")
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report

# Prepare Data
X_synth = synthetic_a.drop('target', axis=1)
y_synth = synthetic_a['target']
X_real_test = real_b.drop('target', axis=1)
y_real_test = real_b['target']

# Train on Synthetic (The "Fake Textbook")
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_synth, y_synth)

# Test on Real (The "Locked Box")
predictions = clf.predict(X_real_test)
accuracy = accuracy_score(y_real_test, predictions)

print(f"TSTR Accuracy: {accuracy:.2f}")
print(classification_report(y_real_test, predictions))
import shap
import numpy as np

explainer = shap.TreeExplainer(clf)
shap_values = explainer.shap_values(X_real_test)

if isinstance(shap_values, list):
    class_1_values = shap_values[1]
elif len(shap_values.shape) == 3:
    class_1_values = shap_values[:, :, 1]
else:
    class_1_values = shap_values

shap.summary_plot(class_1_values, X_real_test)
import torch
from captum.attr import LayerIntegratedGradients
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# Use a tiny model as our proxy probe
model_name = "distilbert-base-uncased-finetuned-sst-2-english"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name)

def predict_path(inputs):
    return model(inputs)[0]

# Proxy Attribution Logic
lig = LayerIntegratedGradients(predict_path, model.distilbert.embeddings)

text = "Patient must undergo bi-weekly biopsies and maintain strict 12-hour fasting."
inputs = tokenizer(text, return_tensors="pt")
input_ids = inputs['input_ids']

# Attribute the 'Risk' output to the words
# (Target 1 = High Risk in this dummy example)
attributions, delta = lig.attribute(inputs=input_ids, target=1, return_convergence_delta=True)

# Visualize the Trigger Words
tokens = tokenizer.convert_ids_to_tokens(input_ids[0])
scores = attributions.sum(dim=-1).squeeze(0).detach().numpy()

for token, score in zip(tokens, scores):
    print(f"Token: {token:12} | Saliency Score: {score:.4f}")
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from scipy.stats import chi2_contingency

def cramers_v(x, y):
    """Calculates Cramer's V for two categorical or binned variables."""
    confusion_matrix = pd.crosstab(x, y)
    chi2 = chi2_contingency(confusion_matrix)[0]
    n = confusion_matrix.sum().sum()
    phi2 = chi2 / n
    r, k = confusion_matrix.shape
    phi2corr = max(0, phi2 - ((k-1)*(r-1)) / (n-1))
    rcorr = r - ((r-1)**2) / (n-1)
    kcorr = k - ((k-1)**2) / (n-1)
    return np.sqrt(phi2corr / min((kcorr-1), (kcorr-1)))

def get_correlation_matrix(df):
    cols = df.columns
    matrix = pd.DataFrame(np.zeros((len(cols), len(cols))), index=cols, columns=cols)
    for i in cols:
        for j in cols:
            matrix.loc[i, j] = cramers_v(df[i], df[j])
    return matrix

# 1. Generate Matrices
real_corr = get_correlation_matrix(real_a)
synth_corr = get_correlation_matrix(synthetic_a)

# 2. Visualize the Comparison (The Fidelity Test)
fig, ax = plt.subplots(1, 2, figsize=(16, 6))
sns.heatmap(real_corr, annot=False, cmap='Blues', ax=ax[0])
ax[0].set_title("Real Data Correlation (Cramer's V)")

sns.heatmap(synth_corr, annot=False, cmap='Blues', ax=ax[1])
ax[1].set_title("Synthetic Data Correlation (Cramer's V)")
plt.show()