-- CreateEnum
CREATE TYPE "public"."DeploymentStatus" AS ENUM ('DEPLOYING', 'DEPLOYED', 'FAILED', 'STOPPED');

-- CreateTable
CREATE TABLE "public"."deployed_wallets" (
    "id" TEXT NOT NULL,
    "canister_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "public"."DeploymentStatus" NOT NULL DEFAULT 'DEPLOYING',
    "metadata" JSONB,
    "wasm_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployed_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "principal" TEXT NOT NULL,
    "address" TEXT,
    "display_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wallet_signers" (
    "id" TEXT NOT NULL,
    "wallet_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "wallet_signers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deployed_wallets_canister_id_key" ON "public"."deployed_wallets"("canister_id");

-- CreateIndex
CREATE UNIQUE INDEX "deployed_wallets_name_key" ON "public"."deployed_wallets"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_principal_key" ON "public"."users"("principal");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_signers_wallet_id_user_id_key" ON "public"."wallet_signers"("wallet_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."wallet_signers" ADD CONSTRAINT "wallet_signers_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "public"."deployed_wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."wallet_signers" ADD CONSTRAINT "wallet_signers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
