
import { insertMonthlyBudgetSchema } from "@shared/schema";

try {
    const budget = {
        month: "2025-26",
        budgetName: "Test Budget",
        totalBudget: "10000",
        salariesBudget: 5000, // Passing number here, schema might expect string
        operationalBudget: "1000",
        equipmentBudget: "1000",
        travelBudget: "1000",
        medicalBudget: "500",
        facilitiesBudget: "500",
        marketingBudget: "500",
        otherBudget: "500",
        notes: "Test",
        createdBy: 1,
    };

    console.log("Testing with number for salariesBudget...");
    insertMonthlyBudgetSchema.parse(budget);
    console.log("Validation SUCCESS!");
} catch (error) {
    console.error("Validation FAILED:", error);
}

try {
    const budgetString = {
        month: "2025-26",
        budgetName: "Test Budget",
        totalBudget: "10000",
        salariesBudget: "5000", // Passing string here
        operationalBudget: "1000",
        equipmentBudget: "1000",
        travelBudget: "1000",
        medicalBudget: "500",
        facilitiesBudget: "500",
        marketingBudget: "500",
        otherBudget: "500",
        notes: "Test",
        createdBy: 1,
    };

    console.log("Testing with string for salariesBudget...");
    insertMonthlyBudgetSchema.parse(budgetString);
    console.log("Validation SUCCESS!");
} catch (error) {
    console.error("Validation FAILED:", error);
}
