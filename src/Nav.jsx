import { Link, NavLink } from "react-router-dom"

const Nav = () => {

    const activeLink = "underline underline-offset-4 text-white text-lg font-semibold";
    const inactiveLink = "text-white text-lg font-semibold hover:underline underline-offset-4";

  return (
    <nav className="p-4 bg-green-600 flex flex-row mb-6 justify-between">
        <h1 className="text-xl font-bold text-white">💰 Budget App</h1>
        <div className="mr-4 flex flex-row space-x-4">
            <NavLink
                to="/" 
                className={({isActive}) => isActive ? activeLink : inactiveLink }
            >
                Overview
            </NavLink>
            <NavLink 
                to="/list" 
                className={({isActive}) => isActive ? activeLink : inactiveLink }
            >
                Bills List
            </NavLink>
            <NavLink
                to="/addBill" 
                className={({isActive}) => isActive ? activeLink : inactiveLink }
            >
                Add Bill
            </NavLink>
        </div>
    </nav>
  )
}

export default Nav