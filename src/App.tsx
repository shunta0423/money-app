import { useEffect, useState } from "react";

type Expense = {
  name: string;
  amount: number;
  date: string;
};

function App() {
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem("balance");
    return saved ? Number(saved) : 30000;
  });

  const [amount, setAmount] = useState("");

  const [name, setName] = useState("");

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("expenses");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(
      "balance",
      balance.toString()
    );

    localStorage.setItem(
      "expenses",
      JSON.stringify(expenses)
    );
  }, [balance, expenses]);

  const addExpense = () => {
    const value = Number(amount);

    if (!name || !value || value <= 0) return;

    const newExpense: Expense = {
      name,
      amount: value,
      date: new Date().toLocaleDateString(),
    };

    setExpenses((prev) => [
      newExpense,
      ...prev,
    ]);

    setBalance((prev) => prev - value);

    setName("");
    setAmount("");
  };

  const today = new Date();

  const nextPayday = new Date(
    today.getFullYear(),
    today.getMonth(),
    25
  );

  if (today.getDate() >= 25) {
    nextPayday.setMonth(
      nextPayday.getMonth() + 1
    );
  }

  const daysLeft = Math.max(
    1,
    Math.ceil(
      (nextPayday.getTime() -
        today.getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  const dailyBudget = Math.floor(
    balance / daysLeft
  );

  return (
    <div style={{ padding: "20px" }}>
      <h1>家計簿アプリ</h1>

      <h2>現在残高</h2>
      <p>{balance}円</p>

      <h2>支出入力</h2>

      <input
        type="text"
        placeholder="項目名"
        value={name}
        onChange={(e) =>
          setName(e.target.value)
        }
      />

      <br />
      <br />

      <input
        type="number"
        placeholder="金額"
        value={amount}
        onChange={(e) =>
          setAmount(e.target.value)
        }
      />

      <button onClick={addExpense}>
        支出追加
      </button>

      <hr />

      <h2>次の給料日まで</h2>

      <p>あと {daysLeft} 日</p>

      <p>
        1日平均 {dailyBudget} 円
        使えます
      </p>

      <hr />

      <h2>支出履歴</h2>

      {expenses.length === 0 ? (
        <p>まだ支出がありません</p>
      ) : (
        <ul>
          {expenses.map(
            (expense, index) => (
              <li key={index}>
                {expense.date}
                {" "}
                {expense.name}
                {" "}
                {expense.amount}円
              </li>
            )
          )}
        </ul>
      )}
    </div>
  );
}

export default App;