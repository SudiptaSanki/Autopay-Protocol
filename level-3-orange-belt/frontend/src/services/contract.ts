// @ts-nocheck
import {
  Contract,
  Networks,
  TransactionBuilder,
  BASE_FEE,
  Address,
  nativeToScVal,
  xdr,
  rpc
} from '@stellar/stellar-sdk';
import { signTx } from './wallet';

// Level 2 contract — deployed on testnet
export const CONTRACT_ID = 'CC2UJP6YAUW5WXAYOM2227FUYHPY5S2IXMSMC65SVLF6ZHOAVFKVBTDH';
const RPC_URL = 'https://soroban-testnet.stellar.org';

const server = new rpc.Server(RPC_URL);

export interface SubscriptionParams {
  subscriberAddress: string;
  merchantAddress: string;
  tokenAddress: string;  // testnet native XLM SAC
  amount: bigint;        // in stroops (1 XLM = 10_000_000)
  intervalSeconds: bigint; // e.g. 2592000n = 30 days
}

export interface TxResult {
  hash: string;
  status: 'SUCCESS' | 'FAILED';
}

export const createSubscriptionTx = async (params: SubscriptionParams): Promise<TxResult> => {
  const contract = new Contract(CONTRACT_ID);
  const account = await server.getAccount(params.subscriberAddress);

  const tx = new TransactionBuilder(account, {
    fee: String(Number(BASE_FEE) * 100),
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      contract.call(
        'create_subscription',
        new Address(params.subscriberAddress).toScVal(),
        nativeToScVal(params.amount, { type: 'i128' }),
        nativeToScVal(params.intervalSeconds, { type: 'u64' })
      )
    )
    .setTimeout(30)
    .build();

  // Simulate first to check for errors
  const simResult = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(simResult)) {
    throw new Error(`Contract simulation failed: ${simResult.error}`);
  }

  const assembledTx = rpc.assembleTransaction(tx, simResult).build();
  const signedXdr = await signTx(assembledTx.toXDR());

  const txToSubmit = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const response = await server.sendTransaction(txToSubmit);

  if (response.status === 'ERROR') {
    throw new Error(`Transaction failed: ${response.errorResult?.result().toXDR('base64')}`);
  }

  // Poll for result
  let pollResult = await server.getTransaction(response.hash);
  let attempts = 0;
  while (pollResult.status === rpc.Api.GetTransactionStatus.NOT_FOUND && attempts < 20) {
    await new Promise(r => setTimeout(r, 1500));
    pollResult = await server.getTransaction(response.hash);
    attempts++;
  }

  if (pollResult.status === rpc.Api.GetTransactionStatus.SUCCESS) {
    return { hash: response.hash, status: 'SUCCESS' };
  } else {
    throw new Error(`Transaction not confirmed: ${pollResult.status}`);
  }
};
