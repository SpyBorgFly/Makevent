import { NavLink } from 'react-router';

export function Header() {
    return (
        <header className="header shadow-glass">
            <div className="header__container">
                <div className="header__logo">
                    <NavLink to='/' className="header__logo-link">
                        <img src="/images/logo.png" alt="logo" className="logo" />
                        <div className="logo-name">EventPro</div>
                    </NavLink>
                </div>
                <nav className="nav">
                    <ul className="nav__menu-list">
                        <li className="nav__menu-list-item"><NavLink to="/" className="menu-link">Дашборд</NavLink></li>
                        <li className="nav__menu-list-item"><NavLink to="/events" className="menu-link">Мероприятия</NavLink></li>
                        <li className="nav__menu-list-item"><NavLink to="/notes" className="menu-link">Заметки</NavLink></li>
                        <li className="nav__menu-list-item"><NavLink to="/finance" className="menu-link">Финансы</NavLink></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
}