from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings

client = AsyncIOMotorClient(settings.mongodb_uri)
db = client[settings.mongodb_db]

disputes_collection = db["disputes"]
evidence_collection = db["dispute_evidence"]
responses_collection = db["dispute_responses"]
audit_logs_collection = db["audit_logs"]
contracts_collection = db["contracts"]
kyc_collection = db["kyc_verifications"]
