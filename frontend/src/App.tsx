import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import Landing from "./screens/Landing";
import Game from "./screens/Game";

const App: React.FC = () => {
  return (
    <div>
      <DndProvider backend={HTML5Backend}>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/game" element={<Game />} />
          </Routes>
        </BrowserRouter>
      </DndProvider>
    </div>
  );
}

export default App;
