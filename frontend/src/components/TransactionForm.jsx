import React, { useState } from 'react';

function TransactionForm({ fields, onSubmit, submitLabel = 'Salvar', initialData = null, onCancel }) {
  const [formData, setFormData] = useState(
    initialData ||
      fields.reduce((acc, field) => {
        acc[field.name] = field.defaultValue || '';
        return acc;
      }, {})
  );
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = fields.reduce((acc, field) => {
      if (field.required && !formData[field.name]) {
        acc[field.name] = `${field.label} e obrigatoria`;
      }
      return acc;
    }, {});

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      {fields.map((field) => (
        <div key={field.name} className="form-group">
          <label htmlFor={field.name}>{field.label}</label>
          {field.type === 'select' ? (
            <select
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              className={errors[field.name] ? 'input-error' : ''}
            >
              <option value="">Selecione...</option>
              {field.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : field.type === 'textarea' ? (
            <textarea
              id={field.name}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              className={errors[field.name] ? 'input-error' : ''}
              rows={field.rows || 3}
            />
          ) : (
            <input
              id={field.name}
              type={field.type || 'text'}
              name={field.name}
              value={formData[field.name] || ''}
              onChange={handleChange}
              step={field.type === 'number' ? '0.01' : undefined}
              min={field.type === 'number' ? '0' : undefined}
              className={errors[field.name] ? 'input-error' : ''}
            />
          )}
          {errors[field.name] && <span className="error-message">{errors[field.name]}</span>}
        </div>
      ))}
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" className="btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default TransactionForm;
