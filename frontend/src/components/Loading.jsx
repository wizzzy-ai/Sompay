import { bouncy } from 'ldrs'
bouncy.register()
import './Loading.css';

// Default values shown
const Loading = ({ size = "45", speed = "1.75", color = "#d4af37" }) => {
  return (
    <div className="loading-container">
      <l-bouncy
        size={size}
        speed={speed}
        color={color}
      ></l-bouncy>
    </div>
  );
};

export default Loading;
