import { useEffect, useMemo, useState } from "react";
import "./App.css";

type Expense = {
  id: string;
  category: string;
  amount: number;
  date: string;
  name?: string;
};

const createExpenseId = () =>
  `${Date.now()}-${Math.random().toString(16).slice(2)}`;

function App() {
  const [balance, setBalance] = useState(() => {
    const saved = localStorage.getItem("balance");
    return saved ? Number(saved) : 30000;
  });

  const [amount, setAmount] = useState("");

  const [category, setCategory] = useState("食費");

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem("expenses");
    if (!saved) return [];

    try {
      const parsed = JSON.parse(saved) as Array<Partial<Expense>>;
      return parsed.map((expense, index) => ({
        id:
          expense.id ||
          `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
        category:
          expense.category || expense.name || "その他",
        amount: Number(expense.amount) || 0,
        date: expense.date || new Date().toISOString(),
        name: expense.name,
      }));
    } catch {
      return [];
    }
  });

  const [displayMonth, setDisplayMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  useEffect(() => {
    localStorage.setItem("balance", balance.toString());
    localStorage.setItem("expenses", JSON.stringify(expenses));
  }, [balance, expenses]);

  const addExpense = () => {
    const value = Number(amount);

    if (!category || !value || value <= 0) return;

    const newExpense: Expense = {
      id: createExpenseId(),
      category,
      amount: value,
      date: new Date().toISOString(),
    };

    setExpenses((prev) => [newExpense, ...prev]);
    setBalance((prev) => prev - value);
    setAmount("");
  };

  const removeExpense = (id: string) => {
    const removed = expenses.find((expense) => expense.id === id);
    if (!removed) return;

    setExpenses((prev) =>
      prev.filter((expense) => expense.id !== id)
    );
    setBalance((prevBalance) => prevBalance + removed.amount);
  };

  const today = new Date();
  const nextPayday = new Date(
    today.getFullYear(),
    today.getMonth(),
    25
  );

  const parseExpenseDate = (dateString: string) => {
    const parsed = new Date(dateString);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }

    const parts = dateString
      .split("/")
      .map((part) => Number(part));

    if (
      parts.length === 3 &&
      !Number.isNaN(parts[0]) &&
      !Number.isNaN(parts[1]) &&
      !Number.isNaN(parts[2])
    ) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    return null;
  };

  const firstDayOfMonth = displayMonth.getDay();
  const daysInMonth = new Date(
    displayMonth.getFullYear(),
    displayMonth.getMonth() + 1,
    0
  ).getDate();

  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - firstDayOfMonth + 1;
    if (dayNumber < 1 || dayNumber > daysInMonth) {
      return null;
    }
    return new Date(
      displayMonth.getFullYear(),
      displayMonth.getMonth(),
      dayNumber
    );
  });

  const categoryClassMap: Record<string, string> = {
    食費: "category-food",
    日用品: "category-goods",
    趣味: "category-fun",
    その他: "category-other",
  };

  const expensesByDay = useMemo(() => {
    const map = new Map<string, Expense[]>();

    expenses.forEach((expense) => {
      const date = parseExpenseDate(expense.date);
      if (!date) return;

      if (
        date.getFullYear() === displayMonth.getFullYear() &&
        date.getMonth() === displayMonth.getMonth()
      ) {
        const key = String(date.getDate());
        const items = map.get(key) ?? [];
        items.push(expense);
        map.set(key, items);
      }
    });

    return map;
  }, [expenses, displayMonth]);

  if (today.getDate() >= 25) {
    nextPayday.setMonth(nextPayday.getMonth() + 1);
  }

  const daysLeft = Math.max(
    1,
    Math.ceil(
      (nextPayday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const dailyBudget = Math.floor(balance / daysLeft);

  return (
    <div className="app-container">
      <div className="app-main">
        <div className="input-section">
          <h2>現在残高</h2>
          <p className="balance-display">{balance}円</p>

          <h2>支出入力</h2>

          <label>
            項目名
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="食費">食費</option>
              <option value="日用品">日用品</option>
              <option value="趣味">趣味</option>
              <option value="その他">その他</option>
            </select>
          </label>

          <br />
          <br />

          <input
            type="number"
            placeholder="金額"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <button onClick={addExpense}>支出追加</button>

          <hr />

          <h2>次の給料日まで</h2>

          <p>あと {daysLeft} 日</p>

          <p>1日平均 {dailyBudget} 円使えます</p>
        </div>

        <div className="calendar-section">
          <h2>支出履歴</h2>

          <div className="calendar-container">
            <div className="calendar-nav">
              <button
                type="button"
                onClick={() =>
                  setDisplayMonth(
                    new Date(
                      displayMonth.getFullYear(),
                      displayMonth.getMonth() - 1,
                      1
                    )
                  )
                }
              >
                前月
              </button>
              <strong>
                {displayMonth.toLocaleDateString("ja-JP", {
                  year: "numeric",
                  month: "long",
                })}
              </strong>
              <button
                type="button"
                onClick={() =>
                  setDisplayMonth(
                    new Date(
                      displayMonth.getFullYear(),
                      displayMonth.getMonth() + 1,
                      1
                    )
                  )
                }
              >
                次月
              </button>
            </div>

            <div className="calendar">
              {["日", "月", "火", "水", "木", "金", "土"].map((weekday) => (
                <div key={weekday} className="calendar-weekday">
                  {weekday}
                </div>
              ))}

              {calendarDays.map((date, index) => {
                const dayKey = date ? String(date.getDate()) : `empty-${index}`;
                const dayExpenses = date
                  ? expensesByDay.get(String(date.getDate()))
                  : undefined;

                return (
                  <div
                    key={dayKey}
                    className={`calendar-day ${
                      date ? "" : "calendar-day--empty"
                    }`}
                  >
                    {date ? (
                      <>
                        <div className="calendar-day-number">
                          {date.getDate()}
                        </div>
                        {dayExpenses && dayExpenses.length > 0 ? (
                          dayExpenses.map((expense, expenseIndex) => {
                            const categoryName =
                              expense.category || expense.name || "支出";
                            const categoryClass =
                              categoryClassMap[expense.category || "その他"] ||
                              "category-other";

                            return (
                              <div
                                key={expenseIndex}
                                className={`expense-item ${categoryClass}`}
                              >
                                <span>
                                  {categoryName} {expense.amount}円
                                </span>
                                <button
                                  type="button"
                                  className="expense-remove"
                                  onClick={() => removeExpense(expense.id)}
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })
                        ) : (
                          <div className="no-expense">予定なし</div>
                        )}
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
