# 📊 Google Sheets Clone

A feature-rich spreadsheet application built with modern web technologies, replicating core functionalities of Google Sheets, including formulas, cell formatting, and data manipulation.

## 🚀 Features

### ✅ Formula Support
- Basic arithmetic operations
- Built-in functions: `SUM`, `AVERAGE`, `MAX`, `MIN`, `COUNT`
- Cell reference parsing (A1 notation)
- Range operations (A1:B10 syntax)

### 📊 Data Management
- CSV import/export
- Row/column operations (add/delete)
- Data quality tools (trim, uppercase, lowercase)
- Duplicate removal
- Find/replace functionality

### 🎨 UI Features
- Cell formatting (bold, italic, font size, colors)
- Context menus and toolbars
- Formula bar with cell reference display
- Google Sheets-like grid interface
- Status bar with selection information

---

## 🛠 Tech Stack

### **Core Technologies**
- **React.js** ⚛️
  - Component-based architecture for efficient UI updates
  - State management using Hooks (`useState`, `useEffect`, `useCallback`)
  - Custom hooks for spreadsheet logic

- **react-data-grid** 📜
  - Provides a high-performance virtualized grid
  - Handles cell rendering and basic grid interactions
  - Supports customizable column system with resizing

---

## 📐 Data Structures

### **Row Data Structure**
```javascript
{
  id: number,
  col0: string|number,
  col1: string|number,
  // Dynamic columns...
}
