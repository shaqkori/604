import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Keyboard,
  TouchableWithoutFeedback,
  
} from "react-native";
import { Saving } from "../types/savings"; 
import SavingsList from "../components/savingsList"; 
import { BASE_URL } from "../src/config";


const Colors = {
  background: "#FAFBE5",
  surface: "#DDEB8E",
  primaryText: "#212529",
  secondaryText: "#6c757d",
  placeholderText: "#adb5bd",
  primary: "#2E931A", 
  success: "#28a745", // Green for success/completion often used in savings
  expense: "#dc3545", // Red for errors
  border: "#dee2e6",
  white: "#ffffff",
  disabled: "#ced4da",
};

const API_URL = `${BASE_URL}/savings`;

const SavingsScreen = () => {
  const [savings, setSavings] = useState<Saving[]>([]);
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");

  // Loading and Error States
  const [loadingSavings, setLoadingSavings] = useState<boolean>(true);
  const [isAddingSaving, setIsAddingSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --- Data Fetching ---
  const fetchSavings = async () => {
    setLoadingSavings(true);
    setError(null); // Clear previous errors on refetch
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Saving[] = await response.json();
      
      data.sort((a, b) => new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime());
      setSavings(data);
    } catch (err) {
      console.error("Error fetching savings:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch savings goals");
    } finally {
      setLoadingSavings(false);
    }
  };

  // --- Actions ---
  const handleAddSaving = async () => {
    // Validation
    const trimmedName = name.trim();
    const numericTargetAmount = parseFloat(targetAmount);

    if (!trimmedName) {
      Alert.alert("Validation Error", "Please enter a name for the saving goal.");
      return;
    }
    if (isNaN(numericTargetAmount) || numericTargetAmount <= 0) {
      Alert.alert("Validation Error", "Please enter a valid positive target amount.");
      return;
    }

    Keyboard.dismiss();
    setIsAddingSaving(true);
    setError(null);

    const newSaving = {
      name: trimmedName,
      targetAmount: numericTargetAmount,
      currentAmount: 0, 
      dateCreated: new Date().toISOString(), 
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSaving),
      });

       if (!response.ok) {
         const errorData = await response.text();
         throw new Error(`Failed to add saving goal: ${response.status} ${errorData}`);
      }

      // Reset form and refresh list on success
      setName("");
      setTargetAmount("");
      await fetchSavings(); // Refresh the list
    } catch (err) {
      console.error("Error adding saving:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred while adding the goal.";
      setError(errorMessage);
      Alert.alert("Error", `Could not add saving goal: ${errorMessage}`);
    } finally {
      setIsAddingSaving(false);
    }
  };

  const handleDeleteSaving = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" }); // send delete request to the api endpoint by selecting the id of the savings
      if (response.ok) fetchSavings();
    } catch (error) {
      console.error("Error deleting saving:", error);
    }
  };

  const handleUpdateSavingAmount = async (savingId: number, newAmount: number) => {
    try {
      const response = await fetch(`${API_URL}/${savingId}`, { //handles the update request
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentAmount: newAmount }), // Send the new currentAmount
      });
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update saving amount: ${response.status} ${errorData}`);
      }
      await fetchSavings(); // Refresh the list after updating
    } catch (error) {
      console.error("Error updating saving amount:", error);
      Alert.alert("Error", "Could not update saving amount.");
    }
  };

  // --- Effects ---
  useEffect(() => {
    fetchSavings();
  }, []);

  return (
    
      <View style={styles.container}>

        {/* --- Add Saving Form --- */}
        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Add New Saving Goal</Text>

          {/* Goal Name Input */}
          <Text style={styles.label}>Goal Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., New Car, Vacation Fund"
            placeholderTextColor={Colors.placeholderText}
            value={name}
            onChangeText={setName}
            editable={!isAddingSaving}
          />

          {/* Target Amount Input */}
          <Text style={styles.label}>Target Amount (£)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.00"
            placeholderTextColor={Colors.placeholderText}
            value={targetAmount}
            onChangeText={setTargetAmount}
            keyboardType="decimal-pad"
            editable={!isAddingSaving}
          />

          {/* Add Button */}
          <TouchableOpacity
            style={[styles.addButton, isAddingSaving && styles.addButtonDisabled]}
            onPress={handleAddSaving}
            disabled={isAddingSaving}
          >
            {isAddingSaving ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.addButtonText}>Add Goal</Text>
            )}
          </TouchableOpacity>

           {/* Display Add/Delete errors here */}
           {error && !loadingSavings && <Text style={styles.errorTextForm}>{error}</Text>}
        </View>

        {/* --- Savings List --- */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Your Goals</Text>
          {loadingSavings ? (
            <ActivityIndicator size="large" color={Colors.primary} style={styles.listLoadingIndicator} />
          ) : error && savings.length === 0 ? ( // Show fetch error prominently if list is empty
             <Text style={styles.errorTextList}>{error}</Text>
          ) : (
            <SavingsList
              savings={savings}
              onDeleteSaving={handleDeleteSaving}
              onUpdateSavingAmount={handleUpdateSavingAmount}
              
            />

          )}
        </View>

      </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  // --- Form Styles ---
  formContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20, 
    paddingVertical: 20,
    margin: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.primaryText,
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.secondaryText,
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: Colors.primaryText,
    marginBottom: 5,
  },
  // --- Add Button Styles ---
  addButton: {
    backgroundColor: Colors.primary, 
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20, 
    marginBottom: 5,
  },
  addButtonDisabled: {
    backgroundColor: Colors.disabled,
  },
  addButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  // --- List Styles ---
  listContainer: {
    flex: 1, 
    paddingHorizontal: 15,
    marginTop: 5,
    marginBottom: 10,
  },
  listLoadingIndicator: {
    marginTop: 30,
    alignSelf: 'center',
  },
  emptyListText: { 
      textAlign: 'center',
      marginTop: 20,
      fontSize: 15,
      color: Colors.secondaryText,
  },
  // --- Error Text Styles ---
   errorTextForm: { 
    fontSize: 14,
    color: Colors.expense,
    marginTop: 10,
    textAlign: 'center',
  },
   errorTextList: { 
    fontSize: 14,
    color: Colors.expense,
    marginTop: 20,
    textAlign: 'center',
    paddingHorizontal: 10, 
  },
});

export default SavingsScreen;