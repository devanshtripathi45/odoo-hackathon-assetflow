-- CreateTable
CREATE TABLE "TransferRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "currentHolderId" TEXT,
    "currentHolderType" TEXT,
    "requesterId" TEXT NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransferRequest_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "TransferRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AllocationHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assetId" TEXT NOT NULL,
    "allocatedToType" TEXT,
    "allocatedToId" TEXT,
    "allocatedById" TEXT,
    "expectedReturnDate" DATETIME,
    "returnedDate" DATETIME,
    "action" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AllocationHistory_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AllocationHistory_allocatedById_fkey" FOREIGN KEY ("allocatedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AllocationHistory" ("action", "allocatedById", "allocatedToId", "assetId", "createdAt", "id", "notes") SELECT "action", "allocatedById", "allocatedToId", "assetId", "createdAt", "id", "notes" FROM "AllocationHistory";
DROP TABLE "AllocationHistory";
ALTER TABLE "new_AllocationHistory" RENAME TO "AllocationHistory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
