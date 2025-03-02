export const TestPanel = ({ onFormulaTest }) => {
    const [testFormula, setTestFormula] = useState('');
    
    return (
      <div className="test-panel">
        <input 
          value={testFormula}
          onChange={(e) => setTestFormula(e.target.value)}
          placeholder="Enter test formula"
        />
        <button onClick={() => onFormulaTest(testFormula)}>Test</button>
      </div>
    );
  };
  
  // Add to main component
  <TestPanel onFormulaTest={(formula) => {
    alert(`Result: ${parseFormula(formula, rows)}`);
  }} />