-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "classroom" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "parentEmail" TEXT,
    "growth" REAL NOT NULL DEFAULT 0,
    "accessCode" TEXT NOT NULL DEFAULT '12345',
    "teacherId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Student_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("accessCode", "age", "classroom", "createdAt", "growth", "id", "name", "parentEmail", "parentName", "updatedAt") SELECT "accessCode", "age", "classroom", "createdAt", "growth", "id", "name", "parentEmail", "parentName", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
