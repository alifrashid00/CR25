import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase';
import LoadingSpinner from '../../components/LoadingSpinner';
import './ManageStudents.css';

const ManageStudents = () => {
    const navigate = useNavigate();
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
            
            // Use query with where clause to filter students only
            const q = query(
                collection(db, "users"),
                where('role', '==', 'student')
            );
            
            const querySnapshot = await getDocs(q);
            const studentsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

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

    const handleMakeAdmin = async (studentId, isCurrentlyCoAdmin) => {
        try {
            await updateDoc(doc(db, "users", studentId), {
                isCoAdmin: !isCurrentlyCoAdmin
            });

            setStudents(students.map(student => 
                student.id === studentId 
                    ? {...student, isCoAdmin: !isCurrentlyCoAdmin}
                    : student
            ));
        } catch (err) {
            console.error('Error updating co-admin status:', err);
            alert('Failed to update co-admin status. Please try again.');
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

    if (loading) return <LoadingSpinner size="large" />;
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
                            </th>
                            <th onClick={() => handleSort('yearOfStudy')}>
                                Year {sortConfig.key === 'yearOfStudy' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                            </th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredAndSortedStudents.map((student) => (
                            <tr 
                                key={student.id} 
                                onClick={() => navigate(`/manage-students/${student.email}`)}
                                className="student-row"
                                style={{ cursor: 'pointer' }}
                            >
                                <td>{`${student.firstName} ${student.lastName}`}</td>
                                <td>{student.email}</td>
                                <td>{student.university}</td>
                                <td>{student.department}</td>
                                <td>{student.yearOfStudy}</td>
                                <td className="action-buttons" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        className={`suspend-button ${student.suspended ? 'unsuspend' : ''}`}
                                        onClick={() => handleSuspend(student.id, student.suspended)}
                                    >
                                        {student.suspended ? 'Unsuspend' : 'Suspend'}
                                    </button>
                                    <button
                                        className={`admin-button ${student.isCoAdmin ? 'revoke' : ''}`}
                                        onClick={() => handleMakeAdmin(student.id, student.isCoAdmin)}
                                    >
                                        {student.isCoAdmin ? 'Revoke Co-Admin' : 'Make Co-Admin'}
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
