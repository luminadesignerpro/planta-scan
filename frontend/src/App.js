import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScannerPage from "@/pages/ScannerPage";
import MyPlantsPage from "@/pages/MyPlantsPage";
import PlantDetailPage from "@/pages/PlantDetailPage";
import RemindersPage from "@/pages/RemindersPage";
import HistoryPage from "@/pages/HistoryPage";
import BottomNav from "@/components/BottomNav";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <div className="app-container">
          <div className="page-content">
            <Routes>
              <Route path="/" element={<ScannerPage />} />
              <Route path="/plants" element={<MyPlantsPage />} />
              <Route path="/plants/:id" element={<PlantDetailPage />} />
              <Route path="/reminders" element={<RemindersPage />} />
              <Route path="/history" element={<HistoryPage />} />
            </Routes>
          </div>
          <BottomNav />
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
