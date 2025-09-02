import { NavLink } from "react-router-dom"

const Nav = () => {

    const activeLink = "underline underline-offset-4 text-white text-lg font-semibold";
    const inactiveLink = "text-white text-lg font-semibold hover:underline underline-offset-4";

  return (
    <nav className="p-4 bg-green-600 flex flex-row mb-6 justify-between items-center w-full mx-auto">
        <div className="bg-white flex p-2 rounded items-center">
            <img src="./public/bill.png" alt="Budget Buddy Mascot" className="h-[50px] mr-2" />
            <h1 className="text-xl font-bold">Bill Buddy</h1>
        </div>
        
        <div className="mr-4 flex flex-row space-x-6">
            <NavLink
                to="/" 
                className={({isActive}) => isActive ? activeLink : inactiveLink }
            >
                Bills Overview
            </NavLink>
            <NavLink 
                to="/list" 
                className={({isActive}) => isActive ? activeLink : inactiveLink }
            >
                Bills Preview
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