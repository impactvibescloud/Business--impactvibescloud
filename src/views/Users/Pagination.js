import React from 'react';
import { Link } from "react-router-dom";
const Pagination = ({ userPerPage, totalUsers, paginate }) => {
    const pageNumbers = [];

    for (let i = 1; i <= Math.ceil(totalUsers / userPerPage); i++) {
        pageNumbers.push(i);
    }

    return (
        <nav>
            <ul className='ml-3 pagination '>
                {pageNumbers.map(number => (
                    <li key={number} className='page-item'>
                        <Link onClick={() => paginate(number)} to="/users" className='page-link'>
                            {number}
                        </Link>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default Pagination;