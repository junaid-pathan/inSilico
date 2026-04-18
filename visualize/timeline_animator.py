from manim import *

class TrialTimeline(Scene):
    """
    Manim script to generate a dynamic 2D/3D timeline of the patient's trial journey.
    This replaces a boring static chart with an engaging 'living' pathway.
    Run this with: manim -pql timeline_animator.py TrialTimeline
    """
    def construct(self):
        # 1. Setup the Title
        title = Text("Your Trial Journey", font_size=40, weight=BOLD)
        title.to_edge(UP)
        self.play(Write(title))

        # 2. Draw the Timeline Base (The Path)
        timeline = NumberLine(
            x_range=[0, 4, 1],
            length=10,
            color=BLUE,
            include_numbers=False,
            include_tip=True
        )
        timeline.shift(DOWN * 0.5)
        self.play(Create(timeline), run_time=2)

        # 3. Define the Milestones (Dynamic from backend)
        import json
        import os
        
        milestones = []
        if os.path.exists("milestones.json"):
            with open("milestones.json", "r") as f:
                milestones = json.load(f)
        else:
            milestones = [
                {"label": "Visit 1\n(Screening)", "pos": 0, "status": "past"},
                {"label": "Visit 2\n(Injection)", "pos": 1, "status": "past"},
                {"label": "Visit 3\n(Checkup)", "pos": 2, "status": "upcoming"},
                {"label": "Visit 4\n(Final)", "pos": 3, "status": "future"}
            ]

        nodes = []
        labels = []

        # 4. Animate Each Milestone
        for m in milestones:
            # Determine color based on status
            if m["status"] == "past":
                color = GREEN
                fill_opacity = 1.0
            elif m["status"] == "upcoming":
                color = YELLOW
                fill_opacity = 0.8
            else:
                color = GRAY
                fill_opacity = 0.5

            # Create the Node
            dot = Dot(point=timeline.n2p(m["pos"]), radius=0.2, color=color)
            dot.set_fill(color, opacity=fill_opacity)
            # Create the Label
            label = Text(m["label"], font_size=20)
            label.next_to(dot, UP, buff=0.5)
            
            nodes.append(dot)
            labels.append(label)

            # Animate drawing the node and label
            self.play(FadeIn(dot, scale=0.5), Write(label), run_time=0.5)

        # 5. Highlight "You Are Here"
        # Assuming we are between Visit 2 and Visit 3
        current_pos = 1.5 
        current_dot = Dot(point=timeline.n2p(current_pos), radius=0.15, color=RED)
        current_label = Text("You Are Here", font_size=18, color=RED, weight=BOLD)
        current_label.next_to(current_dot, DOWN, buff=0.5)

        self.play(Create(current_dot))
        self.play(Write(current_label))
        
        # Add a subtle pulse to the "You Are Here" indicator
        self.play(Indicate(current_dot, scale_factor=1.5, color=RED), run_time=2)

        self.wait(2)

if __name__ == "__main__":
    # In production, we would invoke Manim programmatically here
    # passing in dynamic dates from the Orchestrator.
    print("To render this animation, run:")
    print("manim -pql timeline_animator.py TrialTimeline")
