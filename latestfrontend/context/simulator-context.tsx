"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import {
  patientPresets,
  PatientProfile,
} from "@/components/simulator/patient-profile-form";

interface SimulatorContextType {
  patient: PatientProfile;
  setPatient: React.Dispatch<React.SetStateAction<PatientProfile>>;
  isUploaded: boolean;
  setIsUploaded: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  simulationData: any;
  setSimulationData: React.Dispatch<React.SetStateAction<any>>;
  moaData: any;
  setMoaData: React.Dispatch<React.SetStateAction<any>>;
  baselineScore: any;
  setBaselineScore: React.Dispatch<React.SetStateAction<any>>;
  requestError: string;
  setRequestError: React.Dispatch<React.SetStateAction<string>>;
  isReadyForUpload: boolean;
  setIsReadyForUpload: React.Dispatch<React.SetStateAction<boolean>>;
  updatePatientField: (field: keyof PatientProfile, value: number) => void;
  loadPatientPreset: (preset: keyof typeof patientPresets) => void;
}

const SimulatorContext = createContext<SimulatorContextType | undefined>(undefined);

export function SimulatorProvider({ children }: { children: ReactNode }) {
  const [patient, setPatient] = useState<PatientProfile>(patientPresets.highRisk);
  const [isUploaded, setIsUploaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationData, setSimulationData] = useState<any>(null);
  const [moaData, setMoaData] = useState<any>(null);
  const [baselineScore, setBaselineScore] = useState<any>(null);
  const [requestError, setRequestError] = useState("");
  const [isReadyForUpload, setIsReadyForUpload] = useState(false);

  const updatePatientField = (field: keyof PatientProfile, value: number) => {
    setPatient((current) => {
      if (!Number.isFinite(value)) {
        return current;
      }
      return { ...current, [field]: value };
    });
  };

  const loadPatientPreset = (preset: keyof typeof patientPresets) => {
    setPatient(patientPresets[preset]);
    setBaselineScore(null);
    setRequestError("");
  };

  return (
    <SimulatorContext.Provider
      value={{
        patient,
        setPatient,
        isUploaded,
        setIsUploaded,
        isLoading,
        setIsLoading,
        simulationData,
        setSimulationData,
        moaData,
        setMoaData,
        baselineScore,
        setBaselineScore,
        requestError,
        setRequestError,
        isReadyForUpload,
        setIsReadyForUpload,
        updatePatientField,
        loadPatientPreset,
      }}
    >
      {children}
    </SimulatorContext.Provider>
  );
}

export function useSimulator() {
  const context = useContext(SimulatorContext);
  if (context === undefined) {
    throw new Error("useSimulator must be used within a SimulatorProvider");
  }
  return context;
}
