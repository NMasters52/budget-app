import { useState } from "react";
import { IoCloseCircle, IoMenu } from "react-icons/io5";
import { NavLink } from "react-router-dom"


const Nav = () => {

    const [sidebarOpen, setSidebarOpen] = useState(false)
    const activeLink = "underline underline-offset-4 text-white text-lg font-semibold";
    const inactiveLink = "text-white text-lg font-semibold hover:underline underline-offset-4";


    const links = [
            { to: '/',     label: 'Bills Overview' },
            { to: '/list', label: 'Bills Preview' },
            { to: '/addBill', label: 'Add Bill' },
        ]

  return ( 

    
    <nav className="p-4 bg-green-600 flex flex-row mb-6 justify-between items-center w-full mx-auto">
        <div className="bg-white flex p-2 rounded items-center">
            <img src="/bill.png" alt="Budget Buddy Mascot" className="h-[50px] mr-2" />
            <h1 className="text-xl font-bold">Bill Buddy</h1>
        </div>
        
         {/* Desktop links */}
        <div className="hidden md:flex space-x-6">
            {links.map(({to,label}) => (
            <NavLink key={to} to={to}
                    className={({isActive}) => isActive ? activeLink : inactiveLink}>
                {label}
            </NavLink>
            ))}
        </div>
        
        {/* Mobile Only - Hamburger */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden font-lg cursor-pointer"
            >
                <IoMenu size="3em" color="white"></IoMenu>
            </button>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div className="z-50 fixed flex inset-0">
                    {/* backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setSidebarOpen(false)}
                    />
                    {/* Panel */}
                <div className="relative bg-green-600 w-64 p-6">
                    <button
                        className="absolute top-4 right-4 cursor-pointer"
                        onClick={() => setSidebarOpen(false)}
                        aria-label="Close menu"
                    >
                        <IoCloseCircle size="3em" color="white"></IoCloseCircle>
                    </button>
                    
                    <div className="mt-8 flex flex-col space-y-4">
                    {links.map(({to,label}) => (
                        <NavLink key={to} to={to}
                        className={({isActive}) =>
                            isActive
                            ? activeLink
                            : inactiveLink
                        }
                        onClick={() => setSidebarOpen(false)}
                        >
                        {label}
                        </NavLink>
                    ))}
                    </div>
                </div>
            </div>
            )}
    </nav>
  )
}

export default Nav