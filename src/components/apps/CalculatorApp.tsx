import React, { useEffect, useState } from 'react';

interface CalculatorAppProps {
  isFocused: boolean;
}

type Operator = '+' | '-' | '×' | '÷' | '^' | null;

export const CalculatorApp: React.FC<CalculatorAppProps> = ({ isFocused }) => {
  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [scientific, setScientific] = useState(false);
  const [degMode, setDegMode] = useState(true);
  const [historyLine, setHistoryLine] = useState('');

  const formatNum = (num: number): string => {
    if (!Number.isFinite(num)) return 'Error';
    const rounded = Number(num.toPrecision(12));
    const str = String(rounded);
    return str.length > 14 ? rounded.toExponential(6) : str;
  };

  const calculate = (a: number, b: number, op: Operator): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? NaN : a / b;
      case '^':
        return Math.pow(a, b);
      default:
        return b;
    }
  };

  const inputDigit = (digit: string) => {
    if (display === 'Error') {
      setDisplay(digit);
      setWaitingForOperand(false);
      return;
    }
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display.length < 15 ? display + digit : display);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(`${display}.`);
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
    setHistoryLine('');
  };

  const toggleSign = () => {
    if (display === '0' || display === 'Error') return;
    setDisplay(display.startsWith('-') ? display.slice(1) : `-${display}`);
  };

  const inputPercent = () => {
    const val = parseFloat(display);
    if (!Number.isNaN(val)) {
      setDisplay(formatNum(val / 100));
    }
  };

  const performOperation = (nextOp: Operator) => {
    const inputValue = parseFloat(display);
    if (Number.isNaN(inputValue)) return;

    if (prevValue === null) {
      setPrevValue(inputValue);
      setHistoryLine(`${formatNum(inputValue)} ${nextOp}`);
    } else if (operator && !waitingForOperand) {
      const result = calculate(prevValue, inputValue, operator);
      setDisplay(formatNum(result));
      setPrevValue(result);
      setHistoryLine(`${formatNum(result)} ${nextOp}`);
    } else {
      setHistoryLine(`${formatNum(prevValue)} ${nextOp}`);
    }
    setOperator(nextOp);
    setWaitingForOperand(true);
  };

  const performEquals = () => {
    if (prevValue === null || !operator) return;
    const inputValue = parseFloat(display);
    if (Number.isNaN(inputValue)) return;
    const result = calculate(prevValue, inputValue, operator);
    setHistoryLine(`${formatNum(prevValue)} ${operator} ${formatNum(inputValue)} =`);
    setDisplay(formatNum(result));
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const applyUnary = (fn: string) => {
    const val = parseFloat(display);
    if (Number.isNaN(val)) return;
    const toRad = (v: number) => (degMode ? (v * Math.PI) / 180 : v);
    let result = val;

    switch (fn) {
      case 'sin':
        result = Math.sin(toRad(val));
        break;
      case 'cos':
        result = Math.cos(toRad(val));
        break;
      case 'tan':
        result = Math.tan(toRad(val));
        break;
      case 'ln':
        result = val <= 0 ? NaN : Math.log(val);
        break;
      case 'log':
        result = val <= 0 ? NaN : Math.log10(val);
        break;
      case 'sqrt':
        result = val < 0 ? NaN : Math.sqrt(val);
        break;
      case 'sq':
        result = val * val;
        break;
      case 'inv':
        result = val === 0 ? NaN : 1 / val;
        break;
      case 'pi':
        result = Math.PI;
        break;
      case 'e':
        result = Math.E;
        break;
    }
    setHistoryLine(`${fn}(${fn === 'pi' || fn === 'e' ? '' : formatNum(val)})`);
    setDisplay(formatNum(result));
    setWaitingForOperand(true);
  };

  useEffect(() => {
    if (!isFocused) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }
      if (/^[0-9]$/.test(e.key)) {
        inputDigit(e.key);
      } else if (e.key === '.') {
        inputDecimal();
      } else if (e.key === '+') {
        performOperation('+');
      } else if (e.key === '-') {
        performOperation('-');
      } else if (e.key === '*') {
        performOperation('×');
      } else if (e.key === '/') {
        e.preventDefault();
        performOperation('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        performEquals();
      } else if (e.key === 'Escape') {
        clearAll();
      } else if (e.key === 'Backspace') {
        setDisplay((d) => (d.length <= 1 || d === 'Error' ? '0' : d.slice(0, -1)));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const btnBase =
    'flex items-center justify-center rounded-full text-[15px] font-medium transition-transform active:scale-95 select-none';
  const numBtn = `${btnBase} bg-slate-200/80 dark:bg-slate-700/85 text-slate-900 dark:text-white hover:brightness-95 dark:hover:brightness-115`;
  const fnBtn = `${btnBase} bg-slate-300/90 dark:bg-slate-600/85 text-slate-900 dark:text-slate-100 hover:brightness-95 dark:hover:brightness-115`;
  const sciBtn = `${btnBase} h-9 text-xs bg-slate-200/65 dark:bg-slate-800/90 text-slate-800 dark:text-slate-200 hover:bg-slate-300/80 dark:hover:bg-slate-700`;
  const opBtn = (active: boolean) =>
    `${btnBase} ${
      active
        ? 'bg-white text-orange-500 ring-2 ring-orange-500'
        : 'bg-orange-500 text-white hover:bg-orange-400'
    }`;

  return (
    <div className="flex h-full w-full flex-col bg-slate-100/85 dark:bg-[#16181d] p-3.5 text-slate-900 dark:text-white">
      {/* Mode Toggle Bar */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center rounded-lg bg-black/6 dark:bg-white/8 p-0.5 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setScientific(false)}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              !scientific ? 'bg-white dark:bg-slate-700 shadow-xs' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Basic
          </button>
          <button
            type="button"
            onClick={() => setScientific(true)}
            className={`rounded-md px-2.5 py-1 transition-colors ${
              scientific ? 'bg-white dark:bg-slate-700 shadow-xs' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Scientific
          </button>
        </div>

        {scientific && (
          <button
            type="button"
            onClick={() => setDegMode((d) => !d)}
            className="rounded-md border border-black/10 dark:border-white/15 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
          >
            {degMode ? 'DEG' : 'RAD'}
          </button>
        )}
      </div>

      {/* Display */}
      <div className="mb-3 flex flex-col items-end justify-end rounded-xl bg-white/70 dark:bg-black/25 px-3.5 py-3">
        <div className="h-4 text-xs tabular-nums text-slate-500 dark:text-slate-400">
          {historyLine}
        </div>
        <div
          data-testid="calculator-display"
          className="mt-0.5 w-full truncate text-right font-mono text-3xl font-semibold tracking-tight tabular-nums"
        >
          {display}
        </div>
      </div>

      {/* Scientific Row */}
      {scientific && (
        <div className="mb-2 grid grid-cols-5 gap-1.5">
          <button type="button" onClick={() => applyUnary('sin')} className={sciBtn}>sin</button>
          <button type="button" onClick={() => applyUnary('cos')} className={sciBtn}>cos</button>
          <button type="button" onClick={() => applyUnary('tan')} className={sciBtn}>tan</button>
          <button type="button" onClick={() => applyUnary('ln')} className={sciBtn}>ln</button>
          <button type="button" onClick={() => applyUnary('log')} className={sciBtn}>log</button>
          <button type="button" onClick={() => applyUnary('sqrt')} className={sciBtn}>√x</button>
          <button type="button" onClick={() => applyUnary('sq')} className={sciBtn}>x²</button>
          <button type="button" onClick={() => performOperation('^')} className={sciBtn}>xʸ</button>
          <button type="button" onClick={() => applyUnary('pi')} className={sciBtn}>π</button>
          <button type="button" onClick={() => applyUnary('e')} className={sciBtn}>e</button>
        </div>
      )}

      {/* Main Keypad */}
      <div className="grid flex-1 grid-cols-4 gap-2">
        <button type="button" onClick={clearAll} className={fnBtn}>
          {display === '0' && prevValue === null ? 'AC' : 'C'}
        </button>
        <button type="button" onClick={toggleSign} className={fnBtn}>±</button>
        <button type="button" onClick={inputPercent} className={fnBtn}>%</button>
        <button type="button" onClick={() => performOperation('÷')} className={opBtn(operator === '÷' && waitingForOperand)}>÷</button>

        <button type="button" onClick={() => inputDigit('7')} className={numBtn}>7</button>
        <button type="button" onClick={() => inputDigit('8')} className={numBtn}>8</button>
        <button type="button" onClick={() => inputDigit('9')} className={numBtn}>9</button>
        <button type="button" onClick={() => performOperation('×')} className={opBtn(operator === '×' && waitingForOperand)}>×</button>

        <button type="button" onClick={() => inputDigit('4')} className={numBtn}>4</button>
        <button type="button" onClick={() => inputDigit('5')} className={numBtn}>5</button>
        <button type="button" onClick={() => inputDigit('6')} className={numBtn}>6</button>
        <button type="button" onClick={() => performOperation('-')} className={opBtn(operator === '-' && waitingForOperand)}>−</button>

        <button type="button" onClick={() => inputDigit('1')} className={numBtn}>1</button>
        <button type="button" onClick={() => inputDigit('2')} className={numBtn}>2</button>
        <button type="button" onClick={() => inputDigit('3')} className={numBtn}>3</button>
        <button type="button" onClick={() => performOperation('+')} className={opBtn(operator === '+' && waitingForOperand)}>+</button>

        <button type="button" onClick={() => inputDigit('0')} className={`${numBtn} col-span-2 justify-start pl-6`}>0</button>
        <button type="button" onClick={inputDecimal} className={numBtn}>.</button>
        <button type="button" onClick={performEquals} className={opBtn(false)}>=</button>
      </div>
    </div>
  );
};
