/**
 * 双向 Buck-Boost 计算器
 * 基于《双向 Buck-Boost 完整计算：从参数到选型》文档
 */

const BuckBoostCalculator = {
    /**
     * 执行所有计算
     * @param {number} vH - 高压侧电压 (V)
     * @param {number} vL - 低压侧电压 (V)
     * @param {number} pO - 额定输出功率 (W)
     * @param {number} fSw - 开关频率 (Hz)
     * @param {number} k - 纹波电流比例系数 (默认0.3)
     * @param {number} margin - 电感裕量系数 (默认1.2)
     * @returns {Object} 计算结果
     */
    calculateAll(vH, vL, pO, fSw, k = 0.3, margin = 1.2) {
        const dutyBuck = this.calculateDutyBuck(vH, vL);
        const dutyBoost = this.calculateDutyBoost(vH, vL);
        const iLAvgBuck = this.calculateILAvgBuck(pO, vL);
        const iLAvgBoost = this.calculateILAvgBoost(pO, vH);
        const iLAvg = Math.max(iLAvgBuck, iLAvgBoost);
        const deltaIL = this.calculateDeltaIL(iLAvg, k);
        const lBuck = this.calculateLBuck(vH, vL, fSw, deltaIL);
        const lBoost = this.calculateLBoost(vH, vL, fSw, deltaIL);
        const lFinal = this.calculateLFinal(lBuck, lBoost, margin);
        const iLPeak = this.calculateILPeak(iLAvg, deltaIL);
        const iSat = this.calculateISat(iLPeak);
        const iSWBuck = this.calculateISW(iLAvgBuck, deltaIL);
        const iSWBoost = this.calculateISW(iLAvgBoost, deltaIL);
        const iSWRating = this.calculateISWRating(iSWBuck, iSWBoost);
        const deltaVo = vL * 0.01;
        const cO = this.calculateCO(deltaIL, fSw, deltaVo);
        const pL = this.calculatePL(iLAvg, 0.01);

        return {
            dutyBuck,
            dutyBoost,
            iLAvgBuck,
            iLAvgBoost,
            iLAvg,
            deltaIL,
            lBuck,
            lBoost,
            lFinal,
            iLPeak,
            iSat,
            iSWBuck,
            iSWBoost,
            iSWRating,
            deltaVo,
            cO,
            pL
        };
    },

    /**
     * Buck模式占空比计算
     * D_buck = V_L / V_H
     */
    calculateDutyBuck(vH, vL) {
        if (vH <= 0) throw new Error('V_H必须大于0');
        return vL / vH;
    },

    /**
     * Boost模式占空比计算
     * D_boost = 1 - V_L / V_H
     */
    calculateDutyBoost(vH, vL) {
        if (vH <= 0) throw new Error('V_H必须大于0');
        return 1 - (vL / vH);
    },

    /**
     * Buck模式平均电感电流
     * I_L_avg_buck = P_o / V_L
     */
    calculateILAvgBuck(pO, vL) {
        if (vL <= 0) throw new Error('V_L必须大于0');
        return pO / vL;
    },

    /**
     * Boost模式平均电感电流
     * I_L_avg_boost = P_o / V_H
     */
    calculateILAvgBoost(pO, vH) {
        if (vH <= 0) throw new Error('V_H必须大于0');
        return pO / vH;
    },

    /**
     * 纹波电流计算
     * ΔI_L = k × I_L_avg
     */
    calculateDeltaIL(iLAvg, k = 0.3) {
        if (k <= 0 || k >= 1) throw new Error('纹波系数k应在0.2～0.4之间');
        return k * iLAvg;
    },

    /**
     * Buck模式最小电感
     * L_buck = V_L × (V_H - V_L) / (V_H × f_sw × ΔI_L)
     */
    calculateLBuck(vH, vL, fSw, deltaIL) {
        if (fSw <= 0) throw new Error('开关频率必须大于0');
        if (deltaIL <= 0) throw new Error('纹波电流必须大于0');
        const numerator = vL * (vH - vL);
        const denominator = vH * fSw * deltaIL;
        return (numerator / denominator) * 1e6; // 转换为微亨
    },

    /**
     * Boost模式最小电感
     * L_boost = V_L × (1 - D_boost) / (f_sw × ΔI_L) = V_L × V_L / V_H / (f_sw × ΔI_L)
     */
    calculateLBoost(vH, vL, fSw, deltaIL) {
        if (fSw <= 0) throw new Error('开关频率必须大于0');
        if (deltaIL <= 0) throw new Error('纹波电流必须大于0');
        // Boost模式: D_boost = 1 - V_L/V_H, 所以 (1-D_boost) = V_L/V_H
        const numerator = vL * vL;
        const denominator = vH * fSw * deltaIL;
        return (numerator / denominator) * 1e6; // 转换为微亨
    },

    /**
     * 最终电感取值
     * L = max(L_buck, L_boost) × 裕量系数
     */
    calculateLFinal(lBuck, lBoost, margin = 1.2) {
        return Math.max(lBuck, lBoost) * margin;
    },

    /**
     * 电感峰值电流
     * I_L_peak = I_L_avg + ΔI_L / 2
     */
    calculateILPeak(iLAvg, deltaIL) {
        return iLAvg + deltaIL / 2;
    },

    /**
     * 饱和电流要求
     * I_sat ≥ 1.2 × I_L_peak
     */
    calculateISat(iLPeak) {
        return 1.2 * iLPeak;
    },

    /**
     * 开关管峰值电流
     * I_SW = I_L_avg + ΔI_L / 2
     */
    calculateISW(iLAvg, deltaIL) {
        return iLAvg + deltaIL / 2;
    },

    /**
     * 开关管额定电流
     * I_SW_rating ≥ 1.5 × max(I_SW_buck, I_SW_boost)
     */
    calculateISWRating(iSWBuck, iSWBoost) {
        return 1.5 * Math.max(iSWBuck, iSWBoost);
    },

    /**
     * 输出滤波电容
     * C_o = ΔI_L / (8 × f_sw × ΔV_o)
     */
    calculateCO(deltaIL, fSw, deltaVo) {
        if (fSw <= 0) throw new Error('开关频率必须大于0');
        if (deltaVo <= 0) throw new Error('纹波电压必须大于0');
        const c = deltaIL / (8 * fSw * deltaVo);
        return c * 1e6; // 转换为微法拉
    },

    /**
     * 电感铜损估算
     * P_L = I_L_avg² × DCR (假设DCR=0.01Ω)
     */
    calculatePL(iLAvg, dcr = 0.01) {
        return iLAvg * iLAvg * dcr;
    },

    /**
     * 穿越频率
     * f_c ≈ 0.1 × f_sw
     */
    calculateFCrossover(fSw) {
        return 0.1 * fSw;
    }
};

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BuckBoostCalculator;
}
