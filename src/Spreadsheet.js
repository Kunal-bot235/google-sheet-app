import React, { useState, useCallback, useEffect, useRef } from "react";
import { DataGrid } from "react-data-grid";
import "react-data-grid/lib/styles.css";
// import Draggable from 'react-draggable';
import "./GooglecloneDesign.css"; // Import your custom CSS
import { 
  Trash2, Search, Type, Bold, Italic, 
  ChevronDown, Download, Upload, BarChart,
  ChevronRight, FilePlus, FileText, Save, Settings,
  Plus, Image, Table, 
  Code, Layout, Edit, Share, List, Clipboard,
  Calendar, PenTool, Shapes, Square, Circle,
  SquareFunction, // Add SquareFunction here
  LineChart
} from "lucide-react";

// Default data
const defaultColumns = Array.from({ length: 10 }, (_, i) => ({ 
  key: `col${i}`, 
  name: String.fromCharCode(65 + i), // A, B, C, etc.
  editable: true,
  width: 120,
  headerRenderer: (props) => (
    <div className="flex justify-center font-medium text-gray-700">
      {props.column.name}
    </div>
  )
}));

const defaultRows = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  ...Object.fromEntries(Array.from({ length: 10 }, (_, j) => [`col${j}`, ""]))
}));

// Utility function to determine if a value is a number
const isNumeric = (value) => {
  if (typeof value === 'number') return true;
  if (typeof value !== 'string') return false;
  return !isNaN(value) && !isNaN(parseFloat(value));
};

// Helper function to parse formula strings
// Replace the existing parseFormula function
const parseFormula = (formula, rows) => {
  if (typeof formula !== 'string' || !formula.startsWith('=')) return formula;
  const getCellValue = (cellRef) => {
    const [colStr, rowStr] = cellRef.split(/(\d+)/);
    const col = colStr.toUpperCase().charCodeAt(0) - 65;
    const rowIdx = parseInt(rowStr) - 1;
    return parseFloat(rows[rowIdx]?.[`col${col}`]) || 0;
  };
  if (formula.startsWith('=SUM(')) {
    const range = formula.match(/\((.*?)\)/)[1];
    const values = extractCellsFromRange(range, rows);
    return values.reduce((sum, val) => sum + (Number(val) || 0), 0);
  } 
  else if (formula.startsWith('=AVERAGE(')) {
    const range = formula.match(/\((.*?)\)/)[1];
    const values = extractCellsFromRange(range, rows).map(Number).filter(n => !isNaN(n));
    return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
  }
  else if (formula.startsWith('=MAX(')) {
    const range = formula.match(/\((.*?)\)/)[1];
    const values = extractCellsFromRange(range, rows).map(Number).filter(n => !isNaN(n));
    return values.length ? Math.max(...values) : 0;
  }
  else if (formula.startsWith('=MIN(')) {
    const range = formula.match(/\((.*?)\)/)[1];
    const values = extractCellsFromRange(range, rows).map(Number).filter(n => !isNaN(n));
    return values.length ? Math.min(...values) : 0;
  }
  else if (formula.startsWith('=COUNT(')) {
    const range = formula.match(/\((.*?)\)/)[1];
    return extractCellsFromRange(range, rows).filter(v => !isNaN(v)).length;
  }
  try {
    const cleanFormula = formula.replace(/\s+/g, '');
    const match = cleanFormula.match(/^=([A-Z]+)\(([^)]*)\)$/i);
    if (!match) return formula;

    const [, func, params] = match;
    const paramList = params.split(',').map(p => p.trim());

    const values = paramList.flatMap(param => {
      if (param.includes(':')) {
        return extractCellsFromRange(param, rows);
      }
      return extractCellsFromRange(param, rows);
    }).filter(v => !isNaN(v));

    switch (func.toUpperCase()) {
      case 'SUM':
        return values.reduce((acc, val) => acc + Number(val), 0);
      case 'AVERAGE':
        return values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 0;
      case 'MAX':
        return Math.max(...values);
      case 'MIN':
        return Math.min(...values);
      case 'COUNT':
        return values.length;
      default:
        return formula;
    }
  } catch (error) {
    return `#ERROR!`;
  }
  
};

const extractCellsFromRange = (range, rows) => {
  const cells = [];
  const [start, end] = range.split(':');
  const parseCell = (ref) => {
    const [, colStr, rowStr] = ref.match(/([A-Z]+)(\d+)/i) || [];
    if (!colStr || !rowStr) return null;
    const col = colStr.toUpperCase().split('').reduce((acc, char) => 
      acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
    const row = parseInt(rowStr) - 1;
    return { col, row };
  };

  const startCell = parseCell(start);
  const endCell = parseCell(end || start);

  if (!startCell || !endCell) return [];

  for (let r = startCell.row; r <= endCell.row; r++) {
    for (let c = startCell.col; c <= endCell.col; c++) {
      const cellValue = rows[r]?.[`col${c}`] || '';
      const parsed = typeof cellValue === 'string' && cellValue.startsWith('=') 
        ? parseFormula(cellValue, rows)
        : cellValue;
      
      if (!isNaN(parsed)) cells.push(Number(parsed));
    }
  }
  return cells;
};

// Mathematical functions
const calculateSum = (paramsList, rows) => {
  let sum = 0;
  
  paramsList.forEach(param => {
    const cells = extractCellsFromRange(param, rows);
    cells.forEach(value => {
      sum += value;
    });
  });
  
  return sum;
};

const calculateAverage = (paramsList, rows) => {
  let sum = 0;
  let count = 0;
  
  paramsList.forEach(param => {
    const cells = extractCellsFromRange(param, rows);
    cells.forEach(value => {
      sum += value;
      count++;
    });
  });
  
  return count > 0 ? (sum / count).toFixed(2) : 0;
};

const calculateMax = (paramsList, rows) => {
  let max = Number.NEGATIVE_INFINITY;
  let found = false;
  
  paramsList.forEach(param => {
    const cells = extractCellsFromRange(param, rows);
    cells.forEach(value => {
      if (value > max) {
        max = value;
        found = true;
      }
    });
  });
  
  return found ? max : 0;
};

const calculateMin = (paramsList, rows) => {
  let min = Number.POSITIVE_INFINITY;
  let found = false;
  
  paramsList.forEach(param => {
    const cells = extractCellsFromRange(param, rows);
    cells.forEach(value => {
      if (value < min) {
        min = value;
        found = true;
      }
    });
  });
  
  return found ? min : 0;
};

const calculateCount = (paramsList, rows) => {
  let count = 0;
  
  paramsList.forEach(param => {
    const cells = extractCellsFromRange(param, rows);
    count += cells.length;
  });
  
  return count;
};




export default function GoogleSheetsClone() {
  const [rows, setRows] = useState(defaultRows);
  const [columns, setColumns] = useState(defaultColumns);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [selectedCell, setSelectedCell] = useState(null);
  const [cellContent, setCellContent] = useState("");
  const [formulaBarValue, setFormulaBarValue] = useState("");
  const [selectedRange, setSelectedRange] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dragPosition, setDragPosition] = useState(null);
  const [fillHandlePosition, setFillHandlePosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false); // Tracks if dragging is active
const [dragStartCell, setDragStartCell] = useState(null); // Tracks the starting cell for drag
const [draggedValue, setDraggedValue] = useState(null);
const [dragEndCell, setDragEndCell] = useState(null); // Tracks the ending cell for drag
  // Cell formatting state
  const [cellStyles, setCellStyles] = useState({});
  const [currentStyle, setCurrentStyle] = useState({
    bold: false,
    italic: false,
    fontSize: 14,
    color: "#000000",
    backgroundColor: "#ffffff"
  });
  const [cellFormats, setCellFormats] = useState({});
const [currentFormat, setCurrentFormat] = useState({
  bold: false,
  italic: false,
  fontSize: 14,
  color: '#000000',
  backgroundColor: '#ffffff'
});
  // Refs
  const dataGridRef = useRef(null);
  const formulaBarRef = useRef(null);
  useEffect(() => {
    const updatedColumns = columns.map(col => ({
      ...col,
      renderCell: FormattedCell,
      renderEditCell: EditableCell
    }));
    setColumns(updatedColumns);
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };
  
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);
  // Update formula bar when cell selection changes
  useEffect(() => {
    if (selectedCell) {
      const { rowIdx, columnKey } = selectedCell;
      const rawValue = rows[rowIdx]?.[columnKey] || "";
      setFormulaBarValue(rawValue);
    } else {
      setFormulaBarValue("");
    }
  }, [selectedCell, rows]);

  const handleDropdownToggle = (menu) => {
    if (openDropdown === menu) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(menu);
    }
  };
  // Handle mouse down (start dragging)
  const handleMouseDown = (e) => {
    if (selectedCell) {
      setIsDragging(true);
      setDragStartCell(selectedCell);
      setDragEndCell(selectedCell);
    }
  };
  
  const handleMouseMove = (e) => {
    if (isDragging && selectedCell) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
  
      const col = Math.floor(x / 120); // Column width = 120
      const row = Math.floor(y / 30);  // Row height = 30
  
      // Validate bounds
      if (
        row >= 0 && row < rows.length && 
        col >= 0 && col < columns.length
      ) {
        setDragEndCell({ rowIdx: row, columnKey: `col${col}` });
      }
    }
  };
  
  const handleMouseUp = () => {
    if (isDragging && dragStartCell && dragEndCell) {
      handleDragFill(dragStartCell, dragEndCell);
      setIsDragging(false);
      setDragStartCell(null);
      setDragEndCell(null);
    }
  };

  // Custom cell renderer with formatting support
  const FormattedCell = ({ row, column }) => {
    const cellKey = `${row.id}-${column.key}`;
    const format = cellFormats[cellKey] || {};
    
    return (
      <div style={{
        fontWeight: format.bold ? 'bold' : 'normal',
        fontStyle: format.italic ? 'italic' : 'normal',
        fontSize: `${format.fontSize || 14}px`,
        color: format.color || '#000000',
        backgroundColor: format.backgroundColor || '#ffffff'
      }}>
        {row[column.key]}
      </div>
    );
  };
  
  // Updated EditableCell component
  const EditableCell = ({ row, column, onRowChange }) => {
    const handleChange = (e) => {
      onRowChange({ ...row, [column.key]: e.target.value });
    };
  
    return (
      <input
        className="w-full h-full px-2 py-1 box-border outline-none"
        value={row[column.key] || ''}
        onChange={handleChange}
      />
    );
  };

  // Update columns with the formatting renderer
  

  // Apply text formatting to selected cells
 // Replace your existing applyFormatting function
const applyFormatting = (formatType, value) => {
  if (!selectedCell) return;
  
  const { rowIdx, columnKey } = selectedCell;
  const cellKey = `${rowIdx}-${columnKey}`;
  const currentCellStyle = cellStyles[cellKey] || { ...currentStyle };
  
  let updatedStyle = { ...currentCellStyle };
  
  switch (formatType) {
    case 'bold':
      updatedStyle.bold = !updatedStyle.bold;
      setCurrentStyle(prev => ({ ...prev, bold: updatedStyle.bold }));
      break;
    case 'italic':
      updatedStyle.italic = !updatedStyle.italic;
      setCurrentStyle(prev => ({ ...prev, italic: updatedStyle.italic }));
      break;
    case 'fontSize':
      updatedStyle.fontSize = value;
      setCurrentStyle(prev => ({ ...prev, fontSize: value }));
      break;
    case 'color':
      updatedStyle.color = value;
      setCurrentStyle(prev => ({ ...prev, color: value }));
      break;
    case 'backgroundColor':
      updatedStyle.backgroundColor = value;
      setCurrentStyle(prev => ({ ...prev, backgroundColor: value }));
      break;
  }
  
  setCellStyles(prev => ({
    ...prev,
    [cellKey]: updatedStyle
  }));
};
  const insertFunction = (funcName) => {
    if (!selectedCell) return;
    
    const { rowIdx, columnKey } = selectedCell;
    const newRows = [...rows];
    
    // Insert the function template
    newRows[rowIdx] = {
      ...newRows[rowIdx],
      [columnKey]: `=${funcName}()`
    };
    
    setRows(newRows);
    setFormulaBarValue(`=${funcName}()`);
    
    // Focus formula bar and position cursor inside parentheses
    if (formulaBarRef.current) {
      formulaBarRef.current.focus();
      formulaBarRef.current.setSelectionRange(
        funcName.length + 2, 
        funcName.length + 2
      );
    }
  };
  const handleColumnResize = (idx, width) => {
    const newColumns = [...columns];
    newColumns[idx] = {
      ...newColumns[idx],
      width
    };
    setColumns(newColumns);
  };
  // First, modify your useEffect hook that sets up columns
useEffect(() => {
  const updatedColumns = columns.map(col => ({
    ...col,
    renderCell: FormattedCell,  // Changed from EditableCell
    renderEditCell: EditableCell,
    cellClass: "editable-cell"
  }));
  setColumns(updatedColumns);
}, [cellStyles]);
  // Add this after your existing useEffect hooks
// useEffect(() => {
//   // Force re-render of all cells when any cell changes to update formula results
//   const newRows = [...rows];
//   setRows(newRows);
// }, [rows]);
  // Data quality functions
  const applyFunction = (func) => {
    if (selectedRange) {
      // Apply to selected range
      const { startRow, endRow, startColumn, endColumn } = selectedRange;
      const newRows = [...rows];
      
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startColumn; j <= endColumn; j++) {
          const colKey = `col${j}`;
          if (newRows[i] && newRows[i][colKey] !== undefined) {
            const currentValue = String(newRows[i][colKey] || "");
            
            if (func === "TRIM") newRows[i][colKey] = currentValue.trim();
            if (func === "UPPER") newRows[i][colKey] = currentValue.toUpperCase();
            if (func === "LOWER") newRows[i][colKey] = currentValue.toLowerCase();
          }
        }
      }
      
      setRows(newRows);
    } else {
      // Apply to all cells if no selection
      setRows(rows.map(row => {
        const newRow = { ...row };
        Object.keys(newRow).forEach(key => {
          if (key !== "id") {
            const currentValue = String(newRow[key] || "");
            
            if (func === "TRIM") newRow[key] = currentValue.trim();
            if (func === "UPPER") newRow[key] = currentValue.toUpperCase();
            if (func === "LOWER") newRow[key] = currentValue.toLowerCase();
          }
        });
        return newRow;
      }));
    }
  };

  const removeDuplicates = () => {
    // Create a map to track unique rows
    const seen = new Map();
    const uniqueRows = [];
    
    rows.forEach((row, index) => {
      // Create a string representation of the row content (excluding id)
      const rowString = JSON.stringify(
        Object.entries(row)
          .filter(([key]) => key !== 'id')
          .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
          .map(([_, value]) => value)
      );
      
      if (!seen.has(rowString)) {
        seen.set(rowString, true);
        uniqueRows.push(row);
      }
    });
    
    // Re-assign IDs to ensure they're sequential
    const reindexedRows = uniqueRows.map((row, index) => ({
      ...row,
      id: index
    }));
    
    setRows(reindexedRows);
  };

  const findAndReplace = () => {
    if (!findText) return;
    
    if (selectedRange) {
      // Apply to selected range
      const { startRow, endRow, startColumn, endColumn } = selectedRange;
      const newRows = [...rows];
      
      for (let i = startRow; i <= endRow; i++) {
        for (let j = startColumn; j <= endColumn; j++) {
          const colKey = `col${j}`;
          if (newRows[i] && newRows[i][colKey] !== undefined) {
            const currentValue = String(newRows[i][colKey] || "");
            if (currentValue.includes(findText)) {
              newRows[i][colKey] = currentValue.replace(
                new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), 
                replaceText
              );
            }
          }
        }
      }
      
      setRows(newRows);
    } else {
      // Apply to all cells if no selection
      setRows(rows.map(row => {
        const newRow = { ...row };
        Object.keys(newRow).forEach(key => {
          if (key !== "id") {
            const currentValue = String(newRow[key] || "");
            if (currentValue.includes(findText)) {
              newRow[key] = currentValue.replace(
                new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), "g"), 
                replaceText
              );
            }
          }
        });
        return newRow;
      }));
    }
  };

  // Cell management
  const addRow = () => {
    const newRowId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 0;
    const newRow = { 
      id: newRowId,
      ...Object.fromEntries(columns.map(col => [col.key, ""]))
    };
    setRows([...rows, newRow]);
  };

  const addColumn = () => {
    const newKey = `col${columns.length}`;
    const newColName = columns.length < 26 
      ? String.fromCharCode(65 + columns.length) 
      : `A${String.fromCharCode(65 + columns.length - 26)}`;
    
    setColumns([...columns, { 
      key: newKey, 
      name: newColName, 
      editable: true,
      renderCell: EditableCell,
      renderEditCell: EditableCell,
      cellClass: "editable-cell",
      width: 120,
      headerRenderer: (props) => (
        <div className="flex justify-center font-medium text-gray-700">
          {newColName}
        </div>
      )
    }]);
    
    setRows(rows.map(row => ({ ...row, [newKey]: "" })));
  };

  const deleteRow = () => {
    if (selectedCell && rows.length > 1) {
      const selectedRowId = rows[selectedCell.rowIdx].id;
      const newRows = rows.filter(row => row.id !== selectedRowId);
      setRows(newRows);
      setSelectedCell(null);
    }
  };

  const deleteColumn = () => {
    if (selectedCell && columns.length > 1) {
      const newColumns = columns.filter(col => col.key !== selectedCell.columnKey);
      setColumns(newColumns);
      
      const newRows = rows.map(row => {
        const newRow = { ...row };
        delete newRow[selectedCell.columnKey];
        return newRow;
      });
      
      setRows(newRows);
      setSelectedCell(null);
    } else if (columns.length > 1) {
      // If no cell is selected, remove the last column
      const newColumns = columns.slice(0, -1);
      setColumns(newColumns);
      
      const lastColumnKey = columns[columns.length - 1].key;
      const newRows = rows.map(row => {
        const newRow = { ...row };
        delete newRow[lastColumnKey];
        return newRow;
      });
      
      setRows(newRows);
    }
  };

  // Handle formula bar changes
  const handleFormulaBarChange = (e) => {
    const value = e.target.value;
    setFormulaBarValue(value);
  
    if (selectedCell) {
      const { rowIdx, columnKey } = selectedCell;
      const newRows = [...rows];
      
      // Store raw formula in cell
      newRows[rowIdx] = {
        ...newRows[rowIdx],
        [columnKey]: value
      };
      
      setRows(newRows);
    }
  };
  // Cell selection handlers
  const handleSelectedCellChange = useCallback((position) => {
    if (position) {
      setSelectedCell(position); // Update selected cell
      const { rowIdx, columnKey } = position;
      const cellValue = rows[rowIdx]?.[columnKey] || "";
      setFormulaBarValue(cellValue); // Update formula bar with selected cell value
    } else {
      setSelectedCell(null); // Clear selected cell if position is null
      setFormulaBarValue(""); // Clear formula bar
    }
  }, [rows]);
  const handleSelectedRangeChange = useCallback(({ topLeft, bottomRight }) => {
    if (topLeft && bottomRight) {
      const startColumnMatch = topLeft.columnKey.match(/col(\d+)/);
      const endColumnMatch = bottomRight.columnKey.match(/col(\d+)/);
      
      if (startColumnMatch && endColumnMatch) {
        setSelectedRange({
          startRow: topLeft.rowIdx,
          endRow: bottomRight.rowIdx,
          startColumn: parseInt(startColumnMatch[1]),
          endColumn: parseInt(endColumnMatch[1])
        });
      }
    }
  }, []);

  // Row change handler for the DataGrid
  const handleRowsChange = useCallback((newRows) => {
    setRows(newRows.map(row => {
      const newRow = { ...row };
      columns.forEach(col => {
        if (typeof newRow[col.key] === 'string' && newRow[col.key].startsWith('=')) {
          newRow[col.key] = parseFormula(newRow[col.key], newRows);
        }
      });
      return newRow;
    }));
  }, [columns]);
  // Add this after your existing handler functions
  const handleDragFill = (startCell, endCell) => {
    if (!startCell || !endCell) return;
    
      // Check if columnKey exists before using replace
  if (!startCell.columnKey || !endCell.columnKey) return;

    // Parse start and end positions
    const startCol = parseInt(startCell.columnKey.replace('col', ''), 10);
    const startRow = startCell.rowIdx;
    const endCol = parseInt(endCell.columnKey.replace('col', ''), 10);
    const endRow = endCell.rowIdx;
  
    // Validate indices
    if (
      isNaN(startCol) || isNaN(endCol) || 
      isNaN(startRow) || isNaN(endRow) ||
      startRow < 0 || startRow >= rows.length ||
      endRow < 0 || endRow >= rows.length ||
      startCol < 0 || startCol >= columns.length ||
      endCol < 0 || endCol >= columns.length
    ) {
      return; // Exit if indices are invalid
    }
  
    const newRows = [...rows];
    const originalValue = newRows[startRow]?.[`col${startCol}`] ?? "";
    const stringValue = String(originalValue);
  
    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        // Check if column index is valid
        if (c < 0 || c >= columns.length) continue;
        if (newRows[r]) {
          newRows[r][`col${c}`] = stringValue.replace(
            /([A-Z]+)(\d+)/g, 
            (match, col, row) => {
              const newCol = String.fromCharCode(65 + c + (col.charCodeAt(0) - 65 - startCol));
              return `${newCol}${parseInt(row) + (r - startRow)}`;
            }
          );
        }
      }
    }
  
    setRows(newRows);
  };

  // Import/Export functions
  const exportData = () => {
    // Prepare data
    const csvContent = [
      // Header row
      columns.map(col => col.name).join(','),
      // Data rows
      ...rows.map(row => 
        columns.map(col => {
          let cellValue = row[col.key] || '';
          // Escape commas, quotes
          if (cellValue.includes(',') || cellValue.includes('"')) {
            cellValue = `"${cellValue.replace(/"/g, '""')}"`;
          }
          return cellValue;
        }).join(',')
      )
    ].join('\n');
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'spreadsheet.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const csvData = event.target.result;
      const lines = csvData.split('\n');
      
      if (lines.length > 0) {
        // Parse header row
        const headerRow = lines[0].split(',');
        const newColumns = headerRow.map((name, index) => ({
          key: `col${index}`,
          name: name.trim(),
          editable: true,
          renderCell: EditableCell,
          renderEditCell: EditableCell,
          cellClass: "editable-cell",
          width: 120,
          headerRenderer: (props) => (
            <div className="flex justify-center font-medium text-gray-700">
              {props.column.name}
            </div>
          )
        }));
        
        // Parse data rows
        const newRows = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() === '') continue;
          
          let row = { id: i - 1 };
          // Handle CSV parsing with potential quoted fields containing commas
          const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
          const cells = [];
          let matches;
          while ((matches = regex.exec(`,${lines[i]}`)) !== null) {
            let cell = matches[1];
            if (cell.startsWith('"') && cell.endsWith('"')) {
              cell = cell.slice(1, -1).replace(/""/g, '"');
            }
            cells.push(cell);
          }
          
          for (let j = 0; j < newColumns.length; j++) {
            row[`col${j}`] = j < cells.length ? cells[j] : '';
          }
          
          newRows.push(row);
        }
        
        setColumns(newColumns);
        setRows(newRows);
      }
    };
    
    reader.readAsText(file);
  };

  // Custom CSS for DataGrid to match Google Sheets styling
  const gridStyles = {
    background: "white",
    "--rdg-header-background-color": "#f8f9fa", // Light gray header like Google Sheets
    "--rdg-row-hover-background-color": "#f1f3f4", // Light hover effect
    "--rdg-selection-color": "#e8eaed", // Light selection color
    
  };
  // File dropdown content
const FileDropdown = () => (
  <div className="absolute top-10 left-0 w-56 bg-white shadow-lg border rounded-md z-50">
    <ul className="py-1">
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><FilePlus size={16} className="mr-2" /> New</li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><FileText size={16} className="mr-2" /> Open</li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><Save size={16} className="mr-2" /> Save</li>
      <li className="border-t border-gray-200"></li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><Download size={16} className="mr-2" /> Download</li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><Upload size={16} className="mr-2" /> Import</li>
      <li className="border-t border-gray-200"></li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><Settings size={16} className="mr-2" /> Settings</li>
    </ul>
  </div>
);

// Home dropdown content
const HomeDropdown = () => (
  <div className="absolute top-10 left-0 w-60 bg-white shadow-lg border rounded-md z-50">
    <div className="p-2">
      <h3 className="text-xs font-bold mb-1 text-gray-500">Formatting</h3>
      <div className="grid grid-cols-4 gap-1">
        <button className="p-2 border rounded hover:bg-gray-100"><Bold size={16} /></button>
        <button className="p-2 border rounded hover:bg-gray-100"><Italic size={16} /></button>
        <button className="p-2 border rounded hover:bg-gray-100"><Type size={16} /></button>
        <button className="p-2 border rounded hover:bg-gray-100"><List size={16} /></button>
      </div>
    </div>
    <div className="border-t border-gray-200"></div>
    <div className="p-2">
      <h3 className="text-xs font-bold mb-1 text-gray-500">Clipboard</h3>
      <div className="grid grid-cols-2 gap-1">
        <button className="p-2 border rounded hover:bg-gray-100 flex items-center justify-center"><Clipboard size={16} /> Cut</button>
        <button className="p-2 border rounded hover:bg-gray-100 flex items-center justify-center"><Clipboard size={16} /> Paste</button>
      </div>
    </div>
  </div>
);

// Insert dropdown content
const InsertDropdown = () => (
  <div className="absolute top-10 left-0 w-52 bg-white shadow-lg border rounded-md z-50">
    <ul className="py-1">
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><Table size={16} className="mr-2" /> Table</li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><LineChart size={16} className="mr-2" /> Chart</li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><Image size={16} className="mr-2" /> Image</li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><SquareFunction size={16} className="mr-2" /> Function</li>
      <li className="border-t border-gray-200"></li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><Calendar size={16} className="mr-2" /> Date</li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><Code size={16} className="mr-2" /> Script</li>
    </ul>
  </div>
);

// Draw dropdown content
const DrawDropdown = () => (
  <div className="absolute top-10 left-0 w-52 bg-white shadow-lg border rounded-md z-50">
    <ul className="py-1">
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><PenTool size={16} className="mr-2" /> Line</li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><Square size={16} className="mr-2" /> Rectangle</li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><Circle size={16} className="mr-2" /> Circle</li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><Shapes size={16} className="mr-2" /> Shapes</li>
      <li className="border-t border-gray-200"></li>
      <li className="px-4 py-2 hover:bg-gray-100 flex items-center"><Edit size={16} className="mr-2" /> Edit</li>
    </ul>
  </div>
);
  return (
    
<div className="sheets-container flex flex-col h-full">
  {/* Application Title Bar */}
{/* <div className="bg-gray-100 p-2 border-b border-gray-300">
  <h1 className="text-xl font-bold">Google Sheets Clone</h1>
</div> */}

{/* Main Menu Bar with dropdowns */}
<div className="menu-bar flex flex-row items-center w-full px-4 py-2 border-b bg-gray-100">
  {/* File Button */}
  <div className="relative">
    <button
      className={`menu-button px-2 py-1 flex items-center ${openDropdown === 'file' ? 'bg-gray-200' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        handleDropdownToggle('file');
      }}
    >
      File <ChevronDown size={14} className="ml-1" />
    </button>
    {openDropdown === 'file' && <FileDropdown />}
  </div>

  {/* Home Button */}
  <div className="relative">
    <button
      className={`menu-button px-2 py-1 flex items-center ${openDropdown === 'home' ? 'bg-gray-200' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        handleDropdownToggle('home');
      }}
    >
      Home <ChevronDown size={14} className="ml-1" />
    </button>
    {openDropdown === 'home' && <HomeDropdown />}
  </div>

  {/* Insert Button */}
  <div className="relative">
    <button
      className={`menu-button px-2 py-1 flex items-center ${openDropdown === 'insert' ? 'bg-gray-200' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        handleDropdownToggle('insert');
      }}
    >
      Insert <ChevronDown size={14} className="ml-1" />
    </button>
    {openDropdown === 'insert' && <InsertDropdown />}
  </div>

  {/* Draw Button */}
  <div className="relative">
    <button
      className={`menu-button px-2 py-1 flex items-center ${openDropdown === 'draw' ? 'bg-gray-200' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        handleDropdownToggle('draw');
      }}
    >
      Draw <ChevronDown size={14} className="ml-1" />
    </button>
    {openDropdown === 'draw' && <DrawDropdown />}
  </div>

  {/* Other Buttons (Design, Layout, References, etc.) */}
  <button className="menu-button px-2 py-1">Design</button>
  <button className="menu-button px-2 py-1">Layout</button>
  <button className="menu-button px-2 py-1">References</button>
  <button className="menu-button px-2 py-1">Mailings</button>
  <button className="menu-button px-2 py-1">Review</button>
  <button className="menu-button px-2 py-1">View</button>

  {/* Spacer */}
  <div className="flex-grow"></div>

  {/* Export/Import Buttons */}
  <button
    className="px-3 py-1 mr-1 flex items-center hover:bg-gray-100 whitespace-nowrap text-black rounded-md"
    onClick={exportData}
  >
    <Download size={16} className="mr-1" /> Export
  </button>
  <label className="px-3 py-1 flex items-center hover:bg-gray-100 cursor-pointer whitespace-nowrap text-black rounded-md">
    <Upload size={16} className="mr-1" /> Import
    <input
      type="file"
      accept=".csv"
      className="hidden"
      onChange={importData}
    />
  </label>
</div>

{/* Formatting Toolbar - Also restructured */}
<div className="toolbar flex flex-row items-center bg-white border-b border-gray-300 p-2 overflow-x-auto">
  
  <div className="flex space-x-1 mr-3">
  <div className="formatting-tools flex gap-2 mr-4">
  <button onClick={() => applyFormatting('bold')}><Bold /></button>
  <button onClick={() => applyFormatting('italic')}><Italic /></button>
  <select onChange={(e) => applyFormatting('fontSize', e.target.value)}>
    {[10, 12, 14, 16, 18].map(size => (
      <option key={size} value={size}>{size}</option>
    ))}
  </select>
  <input type="color" onChange={(e) => applyFormatting('color', e.target.value)} />
</div>
  </div>
  
  <div className="toolbar-divider h-6 w-px bg-gray-300 mx-2"></div>
  
  {/* Function buttons */}
  <div className="flex space-x-1 mr-3">
  
<button 
  className="function-button px-2 py-1 bg-blue-50 border border-gray-300 rounded hover:bg-blue-100 whitespace-nowrap" 
  title="Sum function"
  onClick={() => insertFunction('SUM')}
>
  Σ SUM
</button>
<button 
  className="function-button px-2 py-1 bg-blue-50 border border-gray-300 rounded hover:bg-blue-100 whitespace-nowrap" 
  title="Average function"
  onClick={() => insertFunction('AVERAGE')}
>
  μ AVG
</button>
<button 
  className="function-button px-2 py-1 bg-blue-50 border border-gray-300 rounded hover:bg-blue-100 whitespace-nowrap" 
  title="Maximum function"
  onClick={() => insertFunction('MAX')}
>
  ↑ MAX
</button>
<button 
  className="function-button px-2 py-1 bg-blue-50 border border-gray-300 rounded hover:bg-blue-100 whitespace-nowrap" 
  title="Minimum function"
  onClick={() => insertFunction('MIN')}
>
  ↓ MIN
</button>
<button 
  className="function-button px-2 py-1 bg-blue-50 border border-gray-300 rounded hover:bg-blue-100 whitespace-nowrap" 
  title="Count function"
  onClick={() => insertFunction('COUNT')}
>
  # COUNT
</button>
  </div>
  
  <div className="h-6 w-px bg-gray-300 mx-2"></div>
  
  {/* Data quality buttons */}
  <div className="flex space-x-1 mr-3">
    <button className="data-quality-button px-2 py-1 bg-green-50 border border-gray-300 rounded hover:bg-green-100 whitespace-nowrap" onClick={() => applyFunction("UPPER")}>
      <Type size={14} className="inline mr-1" /> UPPER
    </button>
    <button className="data-quality-button data-quality-button -2 py-1 bg-green-50 border border-gray-300 rounded hover:bg-green-100 whitespace-nowrap" onClick={() => applyFunction("LOWER")}>
      <Type size={14} className="inline mr-1" /> LOWER
    </button>
    <button className="data-quality-button px-2 py-1 bg-green-50 border border-gray-300 rounded hover:bg-green-100 whitespace-nowrap" onClick={() => applyFunction("TRIM")}>
      <Type size={14} className="inline mr-1" /> TRIM
    </button>
    <button className="data-quality-button px-2 py-1 bg-red-50 border border-gray-300 rounded hover:bg-red-100 whitespace-nowrap" onClick={removeDuplicates}>
      <Trash2 size={14} className="inline mr-1" /> DEDUP
    </button>
  </div>
  
  <div className="h-6 w-px bg-gray-300 mx-2"></div>
  
  {/* Chart button */}
  <button className="chart-button px-2 py-1 bg-purple-50 border border-gray-300 rounded hover:bg-purple-100 whitespace-nowrap">
    <BarChart size={14} className="inline mr-1" /> Chart
  </button>
</div>

{/* Find & Replace toolbar */}
<div className="find-replace-container flex flex-row items-center bg-white border-b border-gray-300 p-2 overflow-x-auto">
  <div className="flex items-center space-x-2 mr-6">
    <input
      type="text"
      placeholder="Find"
      value={findText}
      onChange={(e) => setFindText(e.target.value)}
      className="find-replace-input px-2 py-1 border rounded w-32"
    />
    <input
      type="text"
      placeholder="Replace"
      value={replaceText}
      onChange={(e) => setReplaceText(e.target.value)}
      className="px-2 py-1 border rounded w-32"
    />
    <button 
      className="px-2 py-1 bg-blue-50 border border-gray-300 rounded hover:bg-blue-100 whitespace-nowrap"
      onClick={findAndReplace}
    >
      <Search size={14} className="inline mr-1" /> Replace
    </button>
  </div>
  
  <div className="flex-grow"></div>
  
  <div className="flex space-x-1">
    <button 
      className="grid-management-button px-2 py-1 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 whitespace-nowrap"
      onClick={addRow}
    >
      + Row
    </button>
    <button 
      className="grid-management-button px-2 py-1 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 whitespace-nowrap"
      onClick={addColumn}
    >
      + Column
    </button>
    <button 
      className="grid-management-button px-2 py-1 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 whitespace-nowrap"
      onClick={deleteRow}
      disabled={!selectedCell}
    >
      - Row
    </button>
    <button 
      className="grid-management-button px-2 py-1 bg-gray-50 border border-gray-300 rounded hover:bg-gray-100 whitespace-nowrap"
      onClick={deleteColumn}
      disabled={!selectedCell}
    >
      - Column
    </button>
  </div>
</div>

{/* Formula bar */}
<div className="formula-bar flex flex-row items-center p-2 bg-white border-b border-gray-300">
  <div className="cell-reference flex items-center px-2 py-1 bg-gray-100 rounded mr-2">
    <span className="text-gray-500 text-sm">
      {selectedCell && selectedCell.columnKey && selectedCell.columnKey.includes('col') ? 
        `${String.fromCharCode(65 + parseInt(selectedCell.columnKey.replace('col', '')))}${selectedCell.rowIdx + 1}` : 
        ''}
    </span>
  </div>
  <input
    ref={formulaBarRef}
    type="text"
    value={formulaBarValue}
    onChange={handleFormulaBarChange}
    className="formula-input flex-1 px-2 py-1 border rounded"
    placeholder="Enter formula or value"
  />
</div>
     {/* Add this right before the DataGrid component */}
    {selectedCell && (
      
        <div 
          className="fill-handle" 
          style={{
            position: 'absolute',
            left: selectedCell.columnKey * 120 + 100, // Adjust based on your column width
            top: selectedCell.rowIdx * 30 + 30, // Adjust based on your row height
            width: 8,
            height: 8,
            background: '#1a73e8',
            cursor: 'crosshair',
            zIndex: 100
          }}
        />
     
    )}
      
      {/* Data grid */}
      <div
      className="flex-1 overflow-hidden"
  onMouseDown={handleMouseDown}
  onMouseMove={handleMouseMove}
  onMouseUp={handleMouseUp}

      >
        <DataGrid
          ref={dataGridRef}
          columns={columns}
          rows={rows}
          onRowsChange={handleRowsChange}
          onSelectedCellChange={handleSelectedCellChange}
          onSelectedRangeChange={handleSelectedRangeChange}
          onColumnResize={handleColumnResize}
          style={gridStyles}
          className="h-full"
          
          rowKeyGetter={row => row.id}
          defaultColumnOptions={{
            resizable: true,
            sortable: true
          }}
          components={{
            noRowsFallback: <div className="text-center p-4">No data available. Add rows to get started.</div>
          }}
          onCellDragStart={(args) => setDraggedValue(rows[args.rowIdx][args.columnKey])}
  onCellDragOver={(args) => args.preventDefault()}
  onCellDrop={(args) => {
    const newRows = [...rows];
    newRows[args.rowIdx][args.columnKey] = draggedValue;
    setRows(newRows);
  }}
        />
      
      </div>
      
      {/* Status bar */}
      <div className="status-bar bg-gray-100 border-t border-gray-300 p-2 flex justify-between text-xs text-gray-600">
        <div>
          {rows.length} row{rows.length !== 1 ? 's' : ''}, {columns.length} column{columns.length !== 1 ? 's' : ''}
        </div>
        <div>
  {selectedRange ? 
    `${selectedRange.endRow - selectedRange.startRow + 1}×${selectedRange.endColumn - selectedRange.startColumn + 1} range selected` : 
    selectedCell && selectedCell.columnKey && selectedCell.columnKey.includes('col') ? 
      `Cell ${String.fromCharCode(65 + parseInt(selectedCell.columnKey.replace('col', '')))}${selectedCell.rowIdx + 1} selected` : 
      'No selection'
  }
</div>
      </div>
    </div>
  );
}