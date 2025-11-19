import { NavLink } from "react-router";

export function MobileHeader() {
    return (
        <header className="header-mobile shadow-glass">
            <nav className="nav-mobile">
                <ul className="nav-mobile__items">
                    <li className="nav-mobile__item">
                        <NavLink to="/" className="nav-mobile__home">
                            <img src="images/home-icon.svg" alt="home" className="nav-mobile__home-icon nav-icon" />
                                <span className="nav-mobile__link">Дашборд</span>
                        </NavLink>
                    </li>
                    <li className="nav-mobile__item">
                        <NavLink to="/events" className="nav-mobile__events">
                            <img src="images/events-icon.svg" alt="events" className="nav-mobile__events-icon nav-icon" />
                                <span className="nav-mobile__link">Ивенты</span>
                        </NavLink>
                    </li>
                    <li className="nav-mobile__item">
                        <button className="nav-mobile__create-btn">+</button>
                        <span className="nav-mobile__create-text">Новое событие</span>
                    </li>
                    <li className="nav-mobile__item">
                        <NavLink to="" className="nav-mobile__notes">
                            <img src="images/notes-icon.svg" alt="home" className="nav-mobile__notes-icon nav-icon" />
                                <span className="nav-mobile__link">Заметки</span>
                        </NavLink>
                    </li>
                    <li className="nav-mobile__item">
                        <NavLink to="finance" className="nav-mobile__finance">
                            <img src="images/finance.svg" alt="home" className="nav-mobile__finance-icon nav-icon" />
                                <span className="nav-mobile__link">Финансы</span>
                        </NavLink>
                    </li>
                </ul>
            </nav>
        </header>
    );
}