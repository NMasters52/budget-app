const FrequencySelect = ({ id = "frequency", value, onChange, className = "" }) => {
  return (
    <select
      id={id}
      name="frequency"
      value={value}
      onChange={onChange}
      className={className}
    >
      <option value="weekly">Weekly</option>
      <option value="biweekly">Bi-Weekly</option>
      <option value="monthly">Monthly</option>
      <option value="quarterly">Quarterly</option>
      <option value="biannually">Bi-Annually</option>
      <option value="yearly">Yearly</option>
    </select>
  );
};

export default FrequencySelect;
