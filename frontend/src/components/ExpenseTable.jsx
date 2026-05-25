import React from 'react';
import { formatCurrency, formatDate } from '../utils/formatters';

function ExpenseTable({ data, columns, onEdit, onDelete, onAction, actionLabel }) {
  if (!data || data.length === 0) {
    return <div className="empty-state">Nenhum registro encontrado</div>;
  }

  return (
    <div className="expense-table">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {(onEdit || onDelete || onAction) && <th>Acoes</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.format === 'currency'
                    ? formatCurrency(row[col.key])
                    : col.format === 'date'
                    ? formatDate(row[col.key])
                    : col.render
                    ? col.render(row[col.key], row)
                    : row[col.key]}
                </td>
              ))}
              {(onEdit || onDelete || onAction) && (
                <td className="actions-cell">
                  {onAction && (
                    <button className="btn-action" onClick={() => onAction(row)}>
                      {actionLabel}
                    </button>
                  )}
                  {onEdit && (
                    <button className="btn-edit" onClick={() => onEdit(row)}>
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button className="btn-delete" onClick={() => onDelete(row)}>
                      Excluir
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ExpenseTable;
