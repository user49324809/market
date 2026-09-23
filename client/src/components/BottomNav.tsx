const items = [
  { label: 'Рынок', icon: '◫', active: true },
  { label: 'Склад', icon: '▣', active: false },
  { label: 'Дела', icon: '✓', active: false },
  { label: 'Профиль', icon: '○', active: false },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Основная навигация">
      {items.map((item) => (
        <button
          className={`bottom-nav__item${item.active ? ' bottom-nav__item--active' : ''}`}
          type="button"
          key={item.label}
          aria-current={item.active ? 'page' : undefined}
          disabled={!item.active}
        >
          <span className="bottom-nav__icon" aria-hidden="true">
            {item.icon}
          </span>
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
