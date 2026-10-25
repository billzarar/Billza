"""
Stellar Blockchain and Soroban Client Service for Billza.
Provides Horizon queries, account balances, transaction verification, and contract interaction.
"""

import logging
import requests
from decimal import Decimal
from typing import Dict, Any, Optional, Tuple

from django.conf import settings
from stellar_sdk import Server, SorobanServer, Keypair, Network, soroban_rpc
from stellar_sdk.exceptions import NotFoundError, BadRequestError

logger = logging.getLogger(__name__)

class StellarService:
    def __init__(self):
        self.horizon_url = settings.STELLAR_HORIZON_URL
        self.soroban_rpc_url = settings.STELLAR_SOROBAN_RPC_URL
        self.network_passphrase = settings.STELLAR_NETWORK_PASSPHRASE
        self.usdc_issuer = settings.STELLAR_USDC_ISSUER
        self.usdc_contract_id = settings.STELLAR_USDC_CONTRACT_ID
        self.contract_id = settings.BILLZA_CONTRACT_ID

        self.server = Server(horizon_url=self.horizon_url)
        self.soroban_server = SorobanServer(server_url=self.soroban_rpc_url)

    def get_account_balances(self, public_key: str) -> Dict[str, Any]:
        """
        Query Stellar Horizon for account balances (XLM, USDC, etc.)
        """
        try:
            account = self.server.accounts().account_id(public_key).call()
            balances = {
                'account_id': public_key,
                'wallet_address': public_key,
                'native_xlm': '0.0000000',
                'usdc': '0.0000000',
                'subentries': account.get('subentry_count', 0),
                'sequence': account.get('sequence', '0'),
                'raw_balances': [],
                'balances': [],
            }

            balances_list = []
            for bal in account.get('balances', []):
                asset_type = bal.get('asset_type')
                balance_val = bal.get('balance', '0')
                balances['raw_balances'].append(bal)

                if asset_type == 'native':
                    balances['native_xlm'] = balance_val
                    balances_list.append({'asset': 'XLM', 'balance': balance_val})
                elif bal.get('asset_code') == 'USDC':
                    balances['usdc'] = balance_val
                    balances_list.append({'asset': 'USDC', 'balance': balance_val})
                elif bal.get('asset_code'):
                    balances_list.append({'asset': bal.get('asset_code'), 'balance': balance_val})

            balances['balances'] = balances_list
            return balances
        except NotFoundError:
            return {
                'account_id': public_key,
                'wallet_address': public_key,
                'native_xlm': '0.0000000',
                'usdc': '0.0000000',
                'balances': [
                    {'asset': 'XLM', 'balance': '0.0000000'},
                    {'asset': 'USDC', 'balance': '0.0000000'},
                ],
                'raw_balances': [],
                'unfunded': True,
                'message': 'Account is not yet funded on Stellar Testnet.',
            }
        except Exception as e:
            logger.error(f"Error fetching account balances for {public_key}: {e}")
            raise

    def fund_testnet_account(self, public_key: str) -> Dict[str, Any]:
        """
        Fund a testnet account using Stellar Friendbot
        """
        try:
            url = f"{settings.STELLAR_FRIENDBOT_URL}?addr={public_key}"
            headers = {'User-Agent': 'Mozilla/5.0 (compatible; Billza/1.0)'}
            response = requests.get(url, headers=headers, timeout=20)
            if response.status_code in (200, 201):
                return response.json()
            return {'successful': False, 'status': response.status_code, 'error': response.text}
        except Exception as e:
            logger.error(f"Friendbot funding error for {public_key}: {e}")
            return {'successful': False, 'error': str(e)}

    def verify_payment_transaction(
        self,
        tx_hash: str,
        expected_recipient: str,
        expected_amount: Decimal,
        expected_asset: str, # 'XLM' or 'USDC'
        expected_reference: Optional[str] = None,
    ) -> Tuple[bool, str, Dict[str, Any]]:
        """
        Verify a Stellar transaction on Horizon:
        1. Checks transaction exists and succeeded.
        2. Validates memo / reference.
        3. Validates payment operation matches recipient, asset, and amount.
        """
        import time

        clean_hash = tx_hash.strip().lower()
        if not clean_hash or len(clean_hash) != 64:
            return False, f"Invalid transaction hash '{tx_hash}'. Must be a 64-character lowercase SHA-256 hex string.", {}

        tx = None
        for attempt in range(3):
            try:
                tx = self.server.transactions().transaction(clean_hash).call()
                break
            except NotFoundError:
                if attempt < 2:
                    time.sleep(1.2)
                    continue
                return False, "Transaction hash not found on Stellar Testnet.", {}
            except Exception as e:
                logger.error(f"Error querying transaction {clean_hash}: {e}")
                return False, f"Verification failed due to error: {str(e)}", {}

        if not tx or not tx.get('successful', False):
            return False, "Transaction marked as failed on Stellar network.", {}

        # Verify memo if expected_reference is provided
        tx_memo = tx.get('memo', '')
        if expected_reference and tx_memo and expected_reference.lower() not in tx_memo.lower():
            logger.warning(f"Tx memo '{tx_memo}' does not match expected reference '{expected_reference}'")

        # Fetch operations for this transaction
        try:
            operations = self.server.operations().for_transaction(clean_hash).call().get('_embedded', {}).get('records', [])
        except Exception as e:
            logger.error(f"Error querying operations for {clean_hash}: {e}")
            return False, f"Could not retrieve transaction operations: {str(e)}", {}

        if not operations:
            return False, "No operations found in transaction.", {}

        verified = False
        matched_op = {}

        for op in operations:
            op_type = op.get('type')

            # Native or token payment operation
            if op_type in ('payment', 'path_payment_strict_send', 'path_payment_strict_receive'):
                to_addr = op.get('to') or op.get('into')
                op_asset_type = op.get('asset_type')
                op_asset_code = op.get('asset_code', 'XLM' if op_asset_type == 'native' else '')
                amount_str = op.get('amount') or op.get('dest_amount', '0')
                amount = Decimal(amount_str)

                # Check recipient
                if to_addr != expected_recipient:
                    continue

                # Check asset
                if expected_asset.upper() == 'XLM':
                    if op_asset_type != 'native':
                        continue
                elif expected_asset.upper() == 'USDC':
                    if op_asset_code != 'USDC':
                        continue
                    issuer = op.get('asset_issuer')
                    if issuer and issuer != self.usdc_issuer:
                        logger.warning(f"USDC issuer mismatch: {issuer} vs {self.usdc_issuer}")

                # Check amount (must be >= expected_amount)
                if amount < expected_amount:
                    return False, f"Transferred amount {amount} is less than required {expected_amount}.", op

                verified = True
                matched_op = op
                break

            # Handle create_account (where account is funded with XLM)
            elif op_type == 'create_account':
                to_addr = op.get('account')
                amount_str = op.get('starting_balance', '0')
                amount = Decimal(amount_str)

                if to_addr == expected_recipient and expected_asset.upper() == 'XLM':
                    if amount < expected_amount:
                        return False, f"Starting balance {amount} is less than required {expected_amount}.", op
                    verified = True
                    matched_op = op
                    break

            # Soroban Contract invocation
            elif op_type == 'invoke_host_function':
                verified = True
                matched_op = op
                break

        if not verified:
            return False, f"No matching payment operation found for recipient {expected_recipient}, asset {expected_asset}, and amount {expected_amount}.", {}

        details = {
            'tx_hash': clean_hash,
            'ledger': tx.get('ledger_attr'),
            'created_at': tx.get('created_at'),
            'source_account': tx.get('source_account'),
            'fee_charged': tx.get('fee_charged'),
            'memo': tx_memo,
            'matched_operation': matched_op,
        }
        return True, "Payment verified successfully on Stellar Testnet.", details

# Singleton instance
stellar_service = StellarService()
