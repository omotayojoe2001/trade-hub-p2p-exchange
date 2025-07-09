import React from 'react';

interface NotesSectionProps {
  notes: string;
  onNotesChange: (value: string) => void;
}

const NotesSection = ({ notes, onNotesChange }: NotesSectionProps) => {
  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes / Instructions</h3>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        placeholder="Add notes for the merchant, e.g., account for differences"
        rows={3}
        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <p className="text-sm text-gray-500 mt-2">
        Specify details for handling any discrepancies or special instructions
      </p>
      
      <div className="flex items-center mt-3">
        <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full mr-3">
          <span className="text-blue-600 mr-1">🔧</span>
          <span className="text-blue-700 text-sm font-medium">Auto-Assign Difference Account</span>
        </div>
        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">
          Coming Soon
        </span>
      </div>
    </div>
  );
};

export default NotesSection;