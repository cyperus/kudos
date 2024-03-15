import { useRef, useState } from 'react';

interface props {
  onChange: (file: File) => any;
  imageUrl?: string;
}
export const ImageUploader = ({ onChange, imageUrl }: props) => {
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dropRef = useRef(null);
  // handle changes to the files input in the component
  const preventDefault = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  // handle drop events on the file input in the component
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    preventDefault(e);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onChange(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };
  // handle any change events on the file input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.files && e.currentTarget.files[0]) {
      onChange(e.currentTarget.files[0]);
    }
  };
  return (
    <div
      className={`${draggingOver ? 'border-4 border-dashed border-yellow-300 border-rounded' : ''} group rounded-full relative w-24 h-24 flex justify-center items-center bg-gray-400 transition duration-300 ease-in-out hover:bg-gray-500 cursor-pointer`}
      ref={dropRef}
      style={{ backgroundSize: 'cover', ...(imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}) }}
      onDragEnter={() => setDraggingOver(true)}
      onDragLeave={() => setDraggingOver(false)}
      onDrag={preventDefault}
      onDragStart={preventDefault}
      onDragEnd={preventDefault}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
    >
      {imageUrl && <div className="absolute w-full h-full bg-blue-400 opacity-50 rounded-full transition duration-300 ease-in-out group-hover:opacity-0"></div>}
      {<p className="font-extrabold text-4xl text-gray-200 cursor-pointer select-none transition duration-300 ease-in-out group-hover:opacity-0 pointer-events-none z-10">+</p>}
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleChange} />
    </div>
  );
};
