export async function checkTonTransactionConfirmed(userAddress: string, receiver: string, amountTon: number): Promise<boolean> {
  // Lấy lịch sử giao dịch outgoing của user
  const url = `https://tonapi.io/v2/blockchain/accounts/${userAddress}/transactions?limit=20`;
  const res = await fetch(url);
  if (!res.ok) return false;
  const data = await res.json();
  const nanoAmount = Math.round(amountTon * 1e9);
  // console.log('==CHECK TON TX CALLED==');
  // console.log('userAddress:', userAddress);
  // console.log('receiver:', receiver);
  // console.log('amountTon:', amountTon, 'nanoAmount:', nanoAmount);
  // console.log('transactions:', data.transactions)
  // Kiểm tra có giao dịch nào chuyển đúng số tiền tới ví nhận không (dựa vào out_msgs)
  return data.transactions.some((tx: any) => {
    const hasOutMsgs = tx.out_msgs && tx.out_msgs.length > 0;
    const destMatch = hasOutMsgs && tx.out_msgs[0].destination?.address === receiver;
    const valueMatch = hasOutMsgs && Math.abs(Number(tx.out_msgs[0].value) - nanoAmount) < 1e6;
    // console.log('==CHECK TX==');
    // console.log('hasOutMsgs:', hasOutMsgs);
    // console.log('destMatch:', destMatch, 'expected:', receiver, 'actual:', hasOutMsgs ? tx.out_msgs[0].destination?.address : undefined);
    // console.log('valueMatch:', valueMatch, 'expected:', nanoAmount, 'actual:', hasOutMsgs ? tx.out_msgs[0].value : undefined);
    return hasOutMsgs && destMatch && valueMatch;
  });
} 