import { describe, it, expect, beforeEach } from "vitest";
import { MemStorage } from "./storage";
import { InsertUser, InsertPlayer, InsertTeam, isTechnicalStaffRole } from "@shared/schema";

describe("MemStorage", () => {
    let storage: MemStorage;

    beforeEach(() => {
        storage = new MemStorage();
    });

    describe("Users", () => {
        it("should create and retrieve a user", async () => {
            const newUser: InsertUser = {
                username: "testuser",
                password: "password123",
                role: "coach",
                firstName: "Test",
                lastName: "User",
                email: "test@example.com",
            };
            const created = await storage.createUser(newUser);
            expect(created).toBeDefined();
            expect(created.id).toBeDefined();
            expect(created.username).toBe("testuser");

            const retrieved = await storage.getUser(created.id);
            expect(retrieved).toEqual(created);
        });

        it("should return undefined for non-existent user", async () => {
            const retrieved = await storage.getUser(9999);
            expect(retrieved).toBeUndefined();
        });
    });

    describe("Players", () => {
        it("should create and retrieve a player", async () => {
            const newPlayer: InsertPlayer = {
                firstName: "John",
                lastName: "Doe",
                position: "Forward",
                shirtNumber: 9,
                dateOfBirth: "1990-01-01",
                nationality: "USA",
                isActive: true,
                height: 180,
                weight: 75,
            };
            const created = await storage.createPlayer(newPlayer);
            expect(created).toBeDefined();
            expect(created.id).toBeDefined();
            expect(created.firstName).toBe("John");

            const retrieved = await storage.getPlayer(created.id);
            expect(retrieved).toEqual(created);
        });
    });

    describe("Employee invitations", () => {
        it("stores the selected role and marks an invitation as used", async () => {
            const created = await storage.createEmployeeInvitation({
                token: "employee-token",
                role: "fitness_coach",
                email: "coach@example.com",
                invitedBy: 1,
                expiresAt: new Date("2030-01-01T00:00:00.000Z"),
            });

            expect((await storage.getEmployeeInvitationByToken("employee-token"))?.role).toBe("fitness_coach");

            const usedAt = new Date("2029-12-31T00:00:00.000Z");
            const updated = await storage.updateEmployeeInvitation(created.id, { usedAt });
            expect(updated?.usedAt).toEqual(usedAt);
        });
    });

    describe("Registration reminders", () => {
        it("stores reminders for the intended user", async () => {
            const reminder = await storage.createRegistrationReminder({
                targetUserId: 12,
                sentBy: 1,
                missingFields: ["Phone number", "Nationality"],
                message: "Please complete your registration.",
            });

            const reminders = await storage.getRegistrationRemindersForUser(12);
            expect(reminders).toHaveLength(1);
            expect(reminders[0]).toEqual(reminder);
            expect(await storage.getRegistrationRemindersForUser(99)).toEqual([]);
        });
    });
});

describe("technical staff access", () => {
    it("allows technical, analysis, and medical roles only", () => {
        for (const role of ["head_coach", "assistant_coach", "fitness_coach", "goalkeeping_coach", "analyst", "physiotherapist"]) {
            expect(isTechnicalStaffRole(role)).toBe(true);
        }

        for (const role of ["kit_manager", "team_manager", "team_administrative", "club_super_admin", "player"]) {
            expect(isTechnicalStaffRole(role)).toBe(false);
        }
    });
});
