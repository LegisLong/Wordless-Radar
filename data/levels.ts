
import { LevelConfig, Language } from "../types";

export const getLevels = (lang: Language): LevelConfig[] => {
    const isVi = lang === 'vi';

    return [
      // --- PHASE 1: INITIALIZATION (Levels 1-4) ---
      {
        level: 1,
        name: isVi ? "HIỆU CHỈNH" : "CALIBRATION",
        targetScore: 50,
        duration: 30, // Reduced from 60
        rules: {
          description: isVi ? "Bất kỳ từ có nghĩa nào" : "ANY meaningful word",
        },
        promptContext: ""
      },
      {
        level: 2,
        name: isVi ? "BĂNG TẦN HẸP" : "NARROW BAND",
        targetScore: 120,
        duration: 20, // Reduced from 50
        rules: {
          minLength: 4,
          description: isVi ? "Có nghĩa & Dài > 3 ký tự" : "Meaningful & Length > 3",
        },
        promptContext: ""
      },
      {
        level: 3,
        name: isVi ? "SÓNG ALPHA" : "ALPHA WAVE",
        targetScore: 200,
        duration: 20, // Reduced from 45
        rules: {
          includeChar: isVi ? 'a' : 'a',
          description: isVi ? "Phải chứa chữ 'A'" : "Must contain 'A'",
        },
        promptContext: ""
      },
      {
        level: 4,
        name: isVi ? "CHỐNG NHIỄU" : "ANTI-STATIC",
        targetScore: 300,
        duration: 35, // Reduced from 45
        rules: {
          excludeChar: isVi ? 'h' : 'e',
          description: isVi ? "KHÔNG chứa chữ 'H'" : "NO letter 'E'",
        },
        promptContext: ""
      },

      // --- PHASE 2: COMPLEX FILTERING (Levels 5-9) ---
      {
        level: 5,
        name: isVi ? "SÓNG BETA" : "BETA WAVE",
        targetScore: 450,
        duration: 40, // Reduced from 50
        rules: {
          minLength: 5,
          includeChar: isVi ? 't' : 's',
          description: isVi ? "Dài > 4 & Chứa 'T'" : "Length > 4 & Contains 'S'",
        },
        promptContext: ""
      },
      {
        level: 6,
        name: isVi ? "VÙNG HƯ KHÔNG" : "VOID SECTOR",
        targetScore: 600,
        duration: 35, // Reduced from 45
        rules: {
          minLength: 6,
          excludeChar: 'o',
          description: isVi ? "Dài > 5 & KHÔNG có 'O'" : "Length > 5 & NO 'O'",
        },
        promptContext: ""
      },
      {
        level: 7,
        name: isVi ? "TIA GAMMA" : "GAMMA RAY",
        targetScore: 800,
        duration: 35, // Reduced from 45
        rules: {
          minLength: 5,
          includeChar: isVi ? 'g' : 'i',
          description: isVi ? "Dài > 4 & Chứa 'G'" : "Length > 4 & Contains 'I'",
        },
        promptContext: ""
      },
      {
        level: 8,
        name: isVi ? "PHÂN CỰC" : "POLARIZATION",
        targetScore: 1000,
        duration: 30, // Reduced from 45
        rules: {
          includeChar: isVi ? 'h' : 'e',
          excludeChar: isVi ? 'n' : 'a',
          description: isVi ? "Chứa 'H' & KHÔNG có 'N'" : "Has 'E' & NO 'A'",
        },
        promptContext: ""
      },
      {
        level: 9,
        name: isVi ? "KHÔNG GIAN SÂU" : "DEEP SPACE",
        targetScore: 1250,
        duration: 40, // Reduced from 50
        rules: {
          minLength: 7,
          description: isVi ? "Từ DÀI (> 6 ký tự)" : "LONG words (> 6 chars)",
        },
        promptContext: ""
      },

      // --- PHASE 3: EVENT HORIZON (Levels 10-15) ---
      {
        level: 10,
        name: isVi ? "MẬT MÃ" : "CIPHER",
        targetScore: 1500,
        duration: 30, // Reduced from 45
        rules: {
          minLength: 6,
          includeChar: isVi ? 'm' : 'c',
          description: isVi ? "Dài > 5 & Chứa 'M'" : "Length > 5 & Contains 'C'",
        },
        promptContext: ""
      },
      {
        level: 11,
        name: isVi ? "VÙNG YÊN TĨNH" : "QUIET ZONE",
        targetScore: 1750,
        duration: 25, // Reduced from 40
        rules: {
          minLength: 5,
          excludeChar: isVi ? 't' : 's',
          description: isVi ? "Dài > 4 & KHÔNG có 'T'" : "Length > 4 & NO 'S'",
        },
        promptContext: ""
      },
      {
        level: 12,
        name: isVi ? "TINH THỂ LỎNG" : "LIQUID AETHER",
        targetScore: 2050,
        duration: 25, // Reduced from 40
        rules: {
          includeChar: 'l',
          excludeChar: isVi ? 'a' : 'e',
          description: isVi ? "Chứa 'L' & KHÔNG có 'A'" : "Has 'L' & NO 'E'",
        },
        promptContext: ""
      },
      {
        level: 13,
        name: isVi ? "TRỌNG LỰC LỚN" : "HEAVY GRAVITY",
        targetScore: 2350,
        duration: 35, // Reduced from 50
        rules: {
          minLength: 8,
          description: isVi ? "TỪ RẤT DÀI (> 7 ký tự)" : "VERY LONG (> 7 chars)",
        },
        promptContext: ""
      },
      {
        level: 14,
        name: isVi ? "BÃO MẶT TRỜI" : "SOLAR STORM",
        targetScore: 2700,
        duration: 30, // Reduced from 45
        rules: {
          minLength: 7,
          includeChar: isVi ? 'u' : 'r',
          description: isVi ? "Dài > 6 & Chứa 'U'" : "Length > 6 & Contains 'R'",
        },
        promptContext: ""
      },
      {
        level: 15,
        name: isVi ? "CHÂN TRỜI SỰ KIỆN" : "EVENT HORIZON",
        targetScore: 3000,
        duration: 25, // Reduced from 45
        rules: {
          minLength: 7,
          includeChar: 'o',
          excludeChar: isVi ? 'n' : 'e',
          description: isVi ? "Dài > 6, Chứa 'O', KO 'N'" : "Length > 6, Has 'O', NO 'E'",
        },
        promptContext: ""
      },
      {
        level: 15,
        name: isVi ? "VÔ TẬN" : "ENDLESS",
        targetScore: 99999,
        duration: 5000, // Reduced from 45
        rules: {
          minLength: 7,
          includeChar: 'o',
          excludeChar: isVi ? 'n' : 'e',
          description: isVi ? "Dài > 6, Chứa 'O', KO 'N'" : "Length > 6, Has 'O', NO 'E'",
        },
        promptContext: ""
      }
    ];
};
