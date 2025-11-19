
import { LevelConfig, Language } from "../types";

export const getLevels = (lang: Language): LevelConfig[] => {
    const isVi = lang === 'vi';

    return [
      {
        level: 1,
        name: isVi ? "HIỆU CHỈNH" : "CALIBRATION",
        targetScore: 50,
        duration: 60,
        rules: {
          description: isVi ? "Bất kỳ từ có nghĩa nào" : "ANY meaningful word",
        },
        promptContext: isVi ? "" : ""
      },
      {
        level: 2,
        name: isVi ? "BĂNG TẦN HẸP" : "NARROW BAND",
        targetScore: 120,
        duration: 45,
        rules: {
          minLength: 5,
          description: isVi ? "Có nghĩa & Dài > 4 ký tự" : "Meaningful & Length > 4",
        },
        promptContext: isVi 
            ? "Từ phải dài ít nhất 5 chữ cái." 
            : "Words must be at least 5 letters long."
      },
      {
        level: 3,
        name: isVi ? "BỘ LỌC PHỨC TẠP" : "COMPLEX FILTER",
        targetScore: 200,
        duration: 45,
        rules: {
          minLength: 6,
          includeChar: isVi ? 'a' : 'r', // 'r' is less common in VI, swapped to 'a' or 'n' usually, but 'a' is safe
          description: isVi ? "Dài > 5 & Chứa 'A'" : "Length > 5 & Contains 'R'",
        },
        promptContext: isVi 
            ? "Từ phải dài ít nhất 6 chữ cái VÀ chứa chữ 'a'." 
            : "Words must be at least 6 letters long AND contain the letter 'r'."
      },
      {
        level: 4,
        name: isVi ? "CHẾ ĐỘ IM LẶNG" : "SILENT MODE",
        targetScore: 9999, // Endless for now
        duration: 45,
        rules: {
          minLength: 4,
          excludeChar: isVi ? 'n' : 'e', // 'e' is super common in EN, 'n' is common in VI
          description: isVi ? "Có nghĩa & KHÔNG có 'N'" : "Meaningful & NO letter 'E'",
        },
        promptContext: isVi 
            ? "Từ KHÔNG ĐƯỢC chứa chữ 'n'." 
            : "Words must NOT contain the letter 'e'."
      }
    ];
};