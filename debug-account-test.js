// 口座データの取得テスト
async function testAccountData() {
  try {
    console.log('Testing account API...');

    // APIサーバーから口座データを取得
    const response = await fetch('http://localhost:3001/api/accounts/list');
    const result = await response.json();

    console.log('API Response:', result);

    if (result.success) {
      console.log('Accounts found:', result.accounts.length);
      result.accounts.forEach(account => {
        console.log(
          `- ${account.accountId}: ${account.accountNumber} (${account.status})`
        );
      });
    } else {
      console.log('API Error:', result.message);
    }
  } catch (error) {
    console.log('Fetch Error:', error.message);

    // LocalStorageからデータを確認
    console.log('\nChecking localStorage...');
    const localAccounts = localStorage.getItem('mockAccounts');
    if (localAccounts) {
      const accounts = JSON.parse(localAccounts);
      console.log('LocalStorage accounts:', accounts.length);
      accounts.forEach(account => {
        console.log(
          `- ${account.accountId}: ${account.accountNumber} (${account.status})`
        );
      });
    } else {
      console.log('No accounts in localStorage');
    }
  }
}

// ページが読み込まれたら実行
if (typeof window !== 'undefined') {
  window.testAccountData = testAccountData;
  console.log(
    'Run testAccountData() in the browser console to test account data'
  );
}
