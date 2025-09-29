
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon, 
  XMarkIcon, 
  PencilSquareIcon, 
  TrashIcon,
  MicrophoneIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import SearchFilter from './SearchFilter';
import { useAuth } from './contexts/AuthContext';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc 
} from 'firebase/firestore';
import './App.css';

// Priority options with colors and icons
const PRIORITY_OPTIONS = [
  { value: 'high', label: 'High', color: '#ef4444', icon: '⚠️' },
  { value: 'medium', label: 'Medium', color: '#f59e42', icon: '🔶' },
  { value: 'low', label: 'Low', color: '#22c55e', icon: '🟢' }
];

function App() {
  // Drag and drop state and handlers must be inside the component
  const [draggedIdx, setDraggedIdx] = useState(null);

  const handleDragStart = (idx) => {
    setDraggedIdx(idx);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (idx) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const updatedTasks = [...tasks];
    const [removed] = updatedTasks.splice(draggedIdx, 1);
    updatedTasks.splice(idx, 0, removed);
    setTasks(updatedTasks);
    setDraggedIdx(null);
  };


  const [editIdx, setEditIdx] = useState(null);
  const [editText, setEditText] = useState('');
  const [error, setError] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [editAttachments, setEditAttachments] = useState([]);

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('tasks');
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState('');

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      type: file.type,
      size: file.size
    }));
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => {
      const newAttachments = [...prev];
      if (newAttachments[index].preview) {
        URL.revokeObjectURL(newAttachments[index].preview);
      }
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const handleEditFileChange = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
      name: file.name,
      type: file.type,
      size: file.size
    }));
    setEditAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeEditAttachment = (index) => {
    setEditAttachments(prev => {
      const newAttachments = [...prev];
      const att = newAttachments[index];
      
      // Cleanup preview URL if it exists
      if (att.preview && !att.isExisting) {
        URL.revokeObjectURL(att.preview);
      }
      
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  useEffect(() => {
    // Convert FileList objects to serializable format before storing
    const serializableTasks = tasks.map(task => ({
      ...task,
      attachments: task.attachments?.map(att => {
        // Convert data to array if it's Uint8Array or ArrayBuffer
        let serializedData;
        if (att.data instanceof Uint8Array) {
          serializedData = Array.from(att.data);
        } else if (att.data instanceof ArrayBuffer) {
          serializedData = Array.from(new Uint8Array(att.data));
        } else {
          serializedData = att.data;
        }

        return {
          name: att.name,
          type: att.type,
          size: att.size,
          data: serializedData
        };
      }) || []
    }));
    localStorage.setItem('tasks', JSON.stringify(serializableTasks));
  }, [tasks]);

  const addTask = () => {
    const trimmed = input.trim();
    if (trimmed === '') {
      setError('Task cannot be empty.');
      return;
    }
    if (tasks.some(task => task.text.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError('Task already exists.');
      return;
    }
    const attachmentData = attachments.map(att => ({
      name: att.name,
      type: att.type,
      size: att.size,
      preview: att.preview,
      data: att.file
    }));

    setTasks([...tasks, {
      text: trimmed,
      done: false,
      dueDate: dueDate || null,
      priority: priority || 'medium',
      attachments: attachmentData
    }]);
    setInput('');
    setDueDate('');
    setPriority('medium');
    setAttachments([]);
    setError('');
  };

  const toggleTask = idx => {
    setTasks(tasks.map((task, i) =>
      i === idx ? { ...task, done: !task.done } : task
    ));
  };

  const deleteTask = idx => {
    setTasks(tasks.filter((_, i) => i !== idx));
    if (editIdx === idx) {
      setEditIdx(null);
      setEditText('');
    }
  };

  const startEdit = (idx) => {
    const taskToEdit = tasks[idx];
    console.log('Task being edited:', taskToEdit);
    setEditIdx(idx);
    setEditText(taskToEdit.text);
    setEditDueDate(taskToEdit.dueDate || '');
    setEditPriority(taskToEdit.priority || 'medium');

    // Initialize edit attachments with existing task attachments
    if (taskToEdit.attachments && taskToEdit.attachments.length > 0) {
      console.log('Found attachments:', taskToEdit.attachments);
      
      // Convert stored attachment data back to proper format
      const existingAttachments = taskToEdit.attachments.map(att => {
        let attachmentData;
        
        // Handle binary data properly
        if (Array.isArray(att.data)) {
          // If data is stored as array, convert it back to Uint8Array
          attachmentData = new Uint8Array(att.data);
        } else {
          attachmentData = att.data;
        }

        // Create blob for preview if it's an image
        const blob = new Blob([attachmentData], { type: att.type });
        const preview = att.type.startsWith('image/') ? URL.createObjectURL(blob) : null;

        return {
          name: att.name,
          type: att.type,
          size: att.size,
          preview: preview,
          data: attachmentData,
          isExisting: true
        };
      });

      console.log('Processed attachments:', existingAttachments);
      setEditAttachments(existingAttachments);
    } else {
      setEditAttachments([]);
    }
  };

  const saveEdit = (idx) => {
    const trimmed = editText.trim();
    if (trimmed === '') {
      setError('Task cannot be empty.');
      return;
    }
    if (tasks.some((task, i) => i !== idx && task.text.trim().toLowerCase() === trimmed.toLowerCase())) {
      setError('Task already exists.');
      return;
    }
    
    // Process attachments, keeping their data intact
    const attachmentData = editAttachments.map(att => {
      // If it's an existing attachment (has isExisting flag)
      if (att.isExisting) {
        return {
          name: att.name,
          type: att.type,
          size: att.size,
          data: att.data,
        };
      }
      // For new attachments
      return {
        name: att.name,
        type: att.type,
        size: att.size,
        data: att.file
      };
    });

    setTasks(tasks.map((task, i) =>
      i === idx ? {
        ...task,
        text: trimmed,
        dueDate: editDueDate || null,
        priority: editPriority || 'medium',
        attachments: attachmentData
      } : task
    ));
    setEditIdx(null);
    setEditText('');
    setEditDueDate('');
    setEditPriority('medium');
    setEditAttachments([]);
    setError('');
  };

  const cancelEdit = () => {
    setEditIdx(null);
    setEditText('');
    setEditDueDate('');
    setEditPriority('medium');
    setEditAttachments([]); // Clear edit attachments
    setError('');
  };

  // Helper function for deadline status
  const getDeadlineStatus = dateStr => {
    if (!dateStr) return null;
    const now = new Date();
    const due = new Date(dateStr);
    const diffMs = due - now;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays > 1) return `Due in ${diffDays} days`;
    if (diffDays === 1) return 'Due tomorrow';
    if (diffDays === 0) return 'Due today';
    if (diffDays < 0) return 'Overdue';
    return null;
  };

  // Sort by priority and split tasks
  const sortByPriority = arr => {
    const order = { high: 0, medium: 1, low: 2 };
    return [...arr].sort((a, b) => order[a.priority || 'medium'] - order[b.priority || 'medium']);
  };

  // Filter and search tasks
  const filterTasks = (tasks) => {
    return tasks.filter(task => {
      const matchesSearch = task.text.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      const matchesStatus = filterStatus === 'all' 
        || (filterStatus === 'active' && !task.done)
        || (filterStatus === 'completed' && task.done);
      return matchesSearch && matchesPriority && matchesStatus;
    });
  };

  // Split tasks into active and completed
  const filteredTasks = filterTasks(tasks);
  const activeTasks = sortByPriority(filteredTasks.filter(task => !task.done));
  const completedTasks = sortByPriority(filteredTasks.filter(task => task.done));

  return (
    <div className="App">
      <h1>To-Do List ✅</h1>
      
      {/* Search and Filter Bar */}
      <div className="search-filter-container">
        <div className="search-bar">
          <MagnifyingGlassIcon className="search-icon w-5 h-5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search tasks..."
            className="search-input"
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm('')}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
          <button
            className={`filter-toggle ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <AdjustmentsHorizontalIcon className="w-5 h-5" />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="filters-panel"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="filter-group">
                <label>Priority:</label>
                <select 
                  value={filterPriority} 
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  {PRIORITY_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.icon} {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Tasks</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="input-container">
        <div className="input-group">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                addTask();
              }
            }}
            placeholder="Add a new task... (Press Enter for new line, Ctrl+Enter to save)"
            className="smart-textarea"
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '8px',
              fontFamily: 'inherit',
              fontSize: 'inherit',
              lineHeight: '1.5',
              minHeight: '60px',
              maxHeight: '150px'
            }}
          />
          <div className="attachments-preview">
            {attachments.map((att, index) => (
              <div key={index} className="attachment-item">
                {att.preview ? (
                  <div className="image-preview">
                    <img src={att.preview} alt={att.name} />
                  </div>
                ) : (
                  <div className="file-preview">
                    📎 {att.name}
                  </div>
                )}
                <button 
                  className="remove-attachment"
                  onClick={() => removeAttachment(index)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="controls-group">
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{ 
                flex: '1',
                minWidth: '130px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}
            />
            <select 
              value={priority} 
              onChange={e => setPriority(e.target.value)} 
              style={{ 
                flex: '1',
                minWidth: '120px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}
            >
              {PRIORITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.icon} {opt.label}
                </option>
              ))}
            </select>
            <label className="file-input-button">
              📎 Add Files
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept="image/*,application/pdf,.doc,.docx,.txt"
              />
            </label>
            <button 
              onClick={addTask}
              style={{
                padding: '8px 24px',
                borderRadius: '8px',
                backgroundColor: '#4f46e5',
                color: 'white',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={e => e.target.style.backgroundColor = '#4338ca'}
              onMouseOut={e => e.target.style.backgroundColor = '#4f46e5'}
            >
              Add
            </button>
          </div>
        </div>
      </div>
      {error && (
        <div style={{ color: '#ef4444', marginBottom: 12, textAlign: 'center', fontWeight: 500 }}>{error}</div>
      )}
      <ul>
        {activeTasks.length === 0 ? (
          <li style={{ justifyContent: 'center', color: '#a5b4fc' }}>No active tasks!</li>
        ) : (
          activeTasks.map((task, idx) => {
            // Find the index in the original tasks array
            const origIdx = tasks.findIndex((t, i) => t === task && !t.done);
            return (
              <li
                key={origIdx}
                draggable
                onDragStart={() => handleDragStart(origIdx)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(origIdx)}
                style={{ opacity: draggedIdx === origIdx ? 0.5 : 1 }}
              >
                {editIdx === origIdx ? (
                  <div className="modal-overlay">
                    <div className="modal">
                      <h2>Edit Task</h2>
                      <div className="modal-form">
                        <textarea
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Escape') cancelEdit();
                            if (e.key === 'Enter' && e.ctrlKey) {
                              e.preventDefault();
                              saveEdit(origIdx);
                            }
                          }}
                          placeholder="Task description"
                          className="smart-textarea modal-textarea"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            fontFamily: 'inherit',
                            fontSize: 'inherit',
                            lineHeight: '1.5',
                            backgroundColor: '#f8fafc',
                            minHeight: '80px',
                            maxHeight: '200px'
                          }}
                        />
                        <input
                          type="date"
                          value={editDueDate}
                          onChange={e => setEditDueDate(e.target.value)}
                        />
                        <select 
                          value={editPriority} 
                          onChange={e => setEditPriority(e.target.value)}
                        >
                          {PRIORITY_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.icon} {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="modal-section">
                          <div className="section-title">Attachments</div>
                          <div className="attachments-preview">
                            {editAttachments.map((att, index) => (
                              <div key={index} className="attachment-item">
                                {att.type.startsWith('image/') ? (
                                  <div className="image-preview">
                                    <img 
                                      src={att.preview} 
                                      alt={att.name} 
                                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                    />
                                    <div className="attachment-name">{att.name}</div>
                                  </div>
                                ) : (
                                  <div className="file-preview">
                                    <div className="file-icon">📎</div>
                                    <div className="file-name">{att.name}</div>
                                  </div>
                                )}
                                <button 
                                  className="remove-attachment"
                                  onClick={() => removeEditAttachment(index)}
                                  aria-label="Remove attachment"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {editAttachments.length === 0 && (
                              <div className="no-attachments">
                                No attachments yet
                              </div>
                            )}
                          </div>
                          <div className="modal-attachments-controls">
                            <label className="file-input-button">
                              📎 Add Files
                              <input
                                type="file"
                                multiple
                                onChange={handleEditFileChange}
                                style={{ display: 'none' }}
                                accept="image/*,application/pdf,.doc,.docx,.txt"
                              />
                            </label>
                            {editAttachments.length > 0 && (
                              <span className="attachment-count">
                                {editAttachments.length} file(s) attached
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="modal-actions">
                          <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                          <button className="save-btn" onClick={() => saveEdit(origIdx)}>Save</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => toggleTask(origIdx)}
                      style={{ marginRight: 10, accentColor: '#22c55e', width: 18, height: 18 }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                      <span
                        onClick={() => toggleTask(origIdx)}
                        className={task.done ? 'done' : ''}
                        style={{ cursor: 'pointer' }}
                      >
                        {task.text}
                      </span>
                      {task.dueDate && (
                        <span style={{
                          fontSize: '0.9em',
                          color: getDeadlineStatus(task.dueDate) === 'Overdue' ? '#ef4444' : '#6366f1',
                          marginTop: 4
                        }}>
                          {getDeadlineStatus(task.dueDate)}
                        </span>
                      )}
                      {task.attachments && task.attachments.length > 0 && (
                        <div className="task-attachments">
                          {task.attachments.map((att, index) => (
                            <div key={index} className="task-attachment">
                              {att.type.startsWith('image/') ? (
                                <img 
                                  src={URL.createObjectURL(new Blob([att.data]))} 
                                  alt={att.name} 
                                  className="attachment-thumbnail" 
                                />
                              ) : (
                                <span className="file-icon">📎 {att.name}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: PRIORITY_OPTIONS.find(opt => opt.value === (task.priority || 'medium')).color,
                          color: '#fff',
                          fontSize: '0.9em'
                        }}
                      >
                        {PRIORITY_OPTIONS.find(opt => opt.value === (task.priority || 'medium')).icon}
                      </span>
                      <div className="todo-actions">
                        <button className="edit-btn" onClick={() => startEdit(origIdx)}>
                          <PencilSquareIcon className="w-5 h-5" />
                        </button>
                        <button className="delete-btn" onClick={() => deleteTask(origIdx)}>
                          <TrashIcon className="w-5 h-5" />
                        </button>
                        <span className="drag-handle" title="Drag to reorder">↕️</span>
                      </div>
                    </div>
                  </>
                )}
              </li>
            );
          })
        )}
      </ul>
      {completedTasks.length > 0 && (
        <>
          <h2 style={{ color: '#22c55e', fontSize: '1.2rem', marginTop: 32, marginBottom: 12, textAlign: 'center' }}>Completed Tasks</h2>
          <ul>
            {completedTasks.map((task, idx) => {
              // Find the index in the original tasks array
              const origIdx = tasks.findIndex((t, i) => t === task && t.done);
              return (
                <li
                  key={origIdx}
                  draggable
                  onDragStart={() => handleDragStart(origIdx)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(origIdx)}
                  style={{ opacity: draggedIdx === origIdx ? 0.5 : 1 }}
                >
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(origIdx)}
                    style={{ marginRight: 10, accentColor: '#22c55e', width: 18, height: 18 }}
                  />
                  <span
                    onClick={() => toggleTask(origIdx)}
                    className={task.done ? 'done' : ''}
                    style={{ cursor: 'pointer' }}
                  >
                    {task.text}
                  </span>
                  <div className="todo-actions">
                    <button className="delete-btn" onClick={() => deleteTask(origIdx)}>
                      <TrashIcon className="w-5 h-5" />
                    </button>
                    <span className="drag-handle" title="Drag to reorder">↕️</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

export default App;
