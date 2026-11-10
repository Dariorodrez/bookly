// client/src/components/EmptyState.jsx
import { Icon } from "./Icons.jsx";

export default function EmptyState({ icon = "calendar", title, text, action }) {
  return (
    <div className="empty">
      <div className="empty__icon">
        <Icon name={icon} size={22} />
      </div>
      <h3 className="empty__title">{title}</h3>
      {text && <p className="empty__text">{text}</p>}
      {action}
    </div>
  );
}
