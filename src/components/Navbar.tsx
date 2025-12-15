import { ReactNode } from "react";

type NavbarProps = {
  brand: ReactNode;
  links: ReactNode;
  actions?: ReactNode;
};

export default function Navbar({ brand, links, actions }: NavbarProps) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="navbar-top">
          <div className="navbar-brand">{brand}</div>
          {actions && <div className="navbar-actions">{actions}</div>}
        </div>
        <nav className="navbar-links">{links}</nav>
      </div>
    </header>
  );
}
