
// Expanded vocabulary for fallback/mock mode
export const SEMANTIC_VOCABULARY_EN = [
  // Short/Medium
  "Galaxy", "Nebula", "Quantum", "Frequency", "Horizon", "Starlight", 
  "Cosmos", "Gravity", "Eclipse", "Meteor", "Pulsar", "Quasar", 
  "Orbit", "Vacuum", "Entropy", "Fusion", "Plasma", "Vortex",
  "Human", "Signal", "Radio", "Connect", "Future", "Memory",
  "Echo", "Drift", "Void", "Spark", "Cipher", "Beacon", "Aether",
  "Zenith", "Nadir", "Epoch", "Chronos", "Helix", "Vector", "Sonic",
  "Resonance", "Crystal", "Mirror", "Shadow", "Light", "Prism",
  "Circuit", "Logic", "Dream", "Vision", "Sound", "Wave", "Pulse",
  "Terra", "Lunar", "Solar", "Astro", "Cyber", "Hyper", "Mega",
  "River", "Ocean", "Mountain", "Forest", "Storm", "Cloud", "Rain",
  "Energy", "Force", "Motion", "Time", "Space", "Matter", "Atom",
  "Cell", "Life", "Mind", "Soul", "Heart", "Blood", "Bone",
  "Star", "Planet", "Moon", "Sun", "Earth", "Mars", "Venus",
  "Code", "Data", "Byte", "Node", "Link", "Grid", "Mesh", "Net",
  "Zero", "One", "Alpha", "Omega", "Prime", "Core", "Base", "Root",
  "Chaos", "Order", "Cycle", "Phase", "Shift", "Drift", "Flux",
  
  // Long / Complex (Added for Levels 10-15)
  "Dimension", "Asteroid", "Satellite", "Telescope", "Universe", "Existence",
  "Vibration", "Spectrum", "Magnetic", "Velocity", "Infinite", "Parallel",
  "Singularity", "Relativity", "Evolution", "Atmosphere", "Constellation",
  "Interstellar", "Transmission", "Navigation", "Coordinates", "Trajectory",
  "Propulsion", "Radiation", "Particle", "Molecule", "Organism", "Consciousness",
  "Intelligence", "Technology", "Mechanism", "Algorithm", "Encryption",
  "Decryption", "Fragment", "Sequence", "Protocol", "Interface", "Network",
  "Connection", "Isolation", "Discovery", "Exploration", "Adventure",
  "Destination", "Departure", "Arrival", "Silence", "Darkness", "Brightness",
  "Invisible", "Ethereal", "Luminous", "Radiant", "Harmonic", "Dynamic"
];

export const SEMANTIC_VOCABULARY_VI = [
  // Short/Medium
  "VũTrụ", "ThiênHà", "Sao", "ÁnhSáng", "BóngTối", "ThờiGian",
  "KhôngGian", "TráiĐất", "MặtTrời", "MặtTrăng", "Sóng", "ÂmThanh",
  "TínHiệu", "KếtNối", "TươngLai", "QuáKhứ", "KýỨc", "Mơ",
  "HyVọng", "ConNgười", "SựSống", "NăngLượng", "NguyênTử", "Lực",
  "TrọngLực", "VôCực", "HưVô", "HuyềnBí", "CôngNghệ", "MáyMóc",
  "ĐiệnTử", "DữLiệu", "MãHóa", "BíMật", "HànhTinh", "VệTinh",
  "ThiênThạch", "Bão", "Gió", "Lửa", "Nước", "Đất", "Khí",
  "SinhHọc", "TếBào", "Gen", "TiếnHóa", "TríTuệ", "CảmXúc",
  "HạnhPhúc", "TựDo", "HòaBình", "ChiếnTranh", "HủyDiệt", "TáiSinh",
  "VĩnhCửu", "KhoảnhKhắc", "NhịpĐiệu", "TầnSố", "VôTuyến",
  "LỗĐen", "QuangPhổ", "TừTrường", "ĐiệnÁp", "ViMạch", "RôBốt",
  "MạngLưới", "ThôngTin", "SángTạo", "KhámPhá", "HànhTrình", "ĐíchĐến",
  "KhởiĐầu", "KếtThúc", "VòngLặp", "MaTrận", "ẢoẢnh", "ChânLý",
  "ĐịnhMệnh", "KỳDiệu", "ThựcTại", "GiảTưởng", "LýThuyết",
  
  // Long / Complex (Added for Levels 10-15)
  "KhôngTrọngLực", "ĐaVũTrụ", "SiêuTânTinh", "HốĐenVũTrụ", "KínhViễnVọng",
  "PhiThuyền", "NgườiNgoàiHànhTinh", "TrạmKhôngGian", "HệMặtTrời", "DảiNgânHà",
  "VậnTốcÁnhSáng", "NămÁnhSáng", "BứcXạVũTrụ", "TừTrườngTráiĐất",
  "SinhVậtHọc", "CôngNghệCao", "TríTuệNhânTạo", "ThựcTếẢo", "LậpTrìnhViên",
  "HệThốngMạng", "AnNinhMạng", "TruyềnThông", "ViễnThông", "ĐiệnThoại",
  "MáyViTính", "ThuậtToán", "CơSởDữLiệu", "PhầnMềm", "PhầnCứng",
  "MôiTrường", "KhíQuyển", "ĐạiDương", "LụcĐịa", "KhoángSản", "TàiNguyên",
  "VôTận", "BấtDiệt", "HuyềnThoại", "CổĐại", "HiệnĐại", "TươngLaiXa"
];

export const getVocabulary = (lang: 'en' | 'vi') => {
    return lang === 'vi' ? SEMANTIC_VOCABULARY_VI : SEMANTIC_VOCABULARY_EN;
}
