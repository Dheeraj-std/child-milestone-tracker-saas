-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "classroom" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "growth" REAL NOT NULL DEFAULT 0,
    "accessCode" TEXT NOT NULL DEFAULT '12345',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Student" ("age", "classroom", "createdAt", "growth", "id", "name", "parentName", "updatedAt") SELECT "age", "classroom", "createdAt", "growth", "id", "name", "parentName", "updatedAt" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
