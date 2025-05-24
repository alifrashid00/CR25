import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import './ManageStudents.css';

const ManageStudents = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({
        key: 'firstName',
        direction: 'asc'
    });

    // Fetch students on component mount
    useEffect(() => {
        fetchStudents();
    }, []);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const usersRef = collection(db, "users");
            const querySnapshot = await getDocs(usersRef);
            const studentsList = [];

            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                if (userData.role === 'student') {
                    studentsList.push({
                        id: doc.id,
                        ...userData
                    });
                }
            });

            setStudents(studentsList);
            setError('');
        } catch (err) {
            console.error('Error fetching students:', err);
            setError('Failed to load students. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSort = (key) => {
        const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, direction });
    };

    const handleSuspend = async (studentId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            await updateDoc(doc(db, "users", studentId), {
                suspended: newStatus
            });

            setStudents(students.map(student => 
                student.id === studentId 
                    ? {...student, suspended: newStatus}
                    : student
            ));
        } catch (err) {
            console.error('Error updating student status:', err);
            alert('Failed to update student status. Please try again.');
        }
    };

    const handleMakeAdmin = async (studentId, currentRole) => {
        try {
            const newRole = currentRole === 'student' ? 'admin' : 'student';
            await updateDoc(doc(db, "users", studentId), {
                role: newRole
            });

            if (newRole === 'admin') {
                setStudents(students.filter(student => student.id !== studentId));
            }
        } catch (err) {
            console.error('Error updating student role:', err);
            alert('Failed to update student role. Please try again.');
        }
    };

    // Filter and sort students
    const filteredAndSortedStudents = students
        .filter(student => {
            const searchLower = searchTerm.toLowerCase();
            return (
                student.firstName?.toLowerCase().includes(searchLower) ||
                student.lastName?.toLowerCase().includes(searchLower) ||
                student.email?.toLowerCase().includes(searchLower) ||
                student.university?.toLowerCase().includes(searchLower) ||
                student.department?.toLowerCase().includes(searchLower)
            );
        })
        .sort((a, b) => {
            if (sortConfig.key === 'name') {
                const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
                const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
                return sortConfig.direction === 'asc' 
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            }
            
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });

    if (loading) return <div className="loading">Loading students...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div className="manage-students-container">
            <div className="manage-students-header">
                <h1>Manage Students</h1>
                <div className="search-bar">
                    <input
                        type="text"
                        placeholder="Search by name, email, university..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="students-table-container">
                <table className="students-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort('name')}>
                                Name {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('email')}>
                                Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('university')}>
                                University {sortConfig.key === 'university' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th onClick={() => handleSort('department')}>
                                Department {sortConfig.key === 'department' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>                            <th onClick={() => handleSort('yearOfStudy')}>
                                Year {sortConfig.key === 'yearOfStudy' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedStudents.map((student) => (
                            <tr key={student.id}>
                                <td>{`${student.firstName} ${student.lastName}`}</td>
                                <td>{student.email}</td>                                <td>{student.university}</td>
                                <td>{student.department}</td>
                                <td>{student.yearOfStudy}</td>
                                <td className="action-buttons">
                                    <button
                                        className={`suspend-button ${student.suspended ? 'unsuspend' : ''}`}
                                        onClick={() => handleSuspend(student.id, student.suspended)}
                                    >
                                        {student.suspended ? 'Unsuspend' : 'Suspend'}
                                    </button>
                                    <button
                                        className="admin-button"
                                        onClick={() => handleMakeAdmin(student.id, student.role)}
                                    >
                                        Make Admin
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ManageStudents;
