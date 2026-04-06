/**
 * 双向 Buck-Boost 计算器单元测试
 */

const BuckBoostCalculator = require('./calculator.js');

describe('BuckBoostCalculator', () => {
    describe('calculateDutyBuck', () => {
        test('计算占空比 V_H=400V, V_L=48V', () => {
            const result = BuckBoostCalculator.calculateDutyBuck(400, 48);
            expect(result).toBeCloseTo(0.12, 4);
        });

        test('计算占空比 V_H=200V, V_L=12V', () => {
            const result = BuckBoostCalculator.calculateDutyBuck(200, 12);
            expect(result).toBeCloseTo(0.06, 4);
        });

        test('V_H为0时应抛出错误', () => {
            expect(() => BuckBoostCalculator.calculateDutyBuck(0, 48)).toThrow('V_H必须大于0');
        });
    });

    describe('calculateDutyBoost', () => {
        test('计算占空比 V_H=400V, V_L=48V', () => {
            const result = BuckBoostCalculator.calculateDutyBoost(400, 48);
            expect(result).toBeCloseTo(0.88, 4);
        });

        test('V_H为0时应抛出错误', () => {
            expect(() => BuckBoostCalculator.calculateDutyBoost(0, 48)).toThrow('V_H必须大于0');
        });
    });

    describe('calculateILAvgBuck', () => {
        test('计算 Buck 模式平均电感电流 P_o=1000W, V_L=48V', () => {
            const result = BuckBoostCalculator.calculateILAvgBuck(1000, 48);
            expect(result).toBeCloseTo(20.833, 2);
        });

        test('V_L为0时应抛出错误', () => {
            expect(() => BuckBoostCalculator.calculateILAvgBuck(1000, 0)).toThrow('V_L必须大于0');
        });
    });

    describe('calculateILAvgBoost', () => {
        test('计算 Boost 模式平均电感电流 P_o=1000W, V_H=400V', () => {
            const result = BuckBoostCalculator.calculateILAvgBoost(1000, 400);
            expect(result).toBeCloseTo(2.5, 2);
        });

        test('V_H为0时应抛出错误', () => {
            expect(() => BuckBoostCalculator.calculateILAvgBoost(1000, 0)).toThrow('V_H必须大于0');
        });
    });

    describe('calculateDeltaIL', () => {
        test('计算纹波电流 k=0.3, I_L_avg=20.83A', () => {
            const result = BuckBoostCalculator.calculateDeltaIL(20.83, 0.3);
            expect(result).toBeCloseTo(6.249, 2);
        });

        test('k值超出范围时应抛出错误', () => {
            expect(() => BuckBoostCalculator.calculateDeltaIL(20.83, 0)).toThrow('纹波系数k应在0.2～0.4之间');
            expect(() => BuckBoostCalculator.calculateDeltaIL(20.83, 1)).toThrow('纹波系数k应在0.2～0.4之间');
        });
    });

    describe('calculateLBuck', () => {
        test('计算 Buck 模式最小电感', () => {
            // L_buck = V_L × (1 - D) / (f_sw × ΔI_L) = 48 × 0.88 / (100000 × 6.25) = 67.58 μH
            const result = BuckBoostCalculator.calculateLBuck(400, 48, 100000, 6.25);
            expect(result).toBeCloseTo(67.58, 1);
        });

        test('fSw为0时应抛出错误', () => {
            expect(() => BuckBoostCalculator.calculateLBuck(400, 48, 0, 6.25)).toThrow('开关频率必须大于0');
        });
    });

    describe('calculateLBoost', () => {
        test('计算 Boost 模式最小电感', () => {
            // L_boost = V_L² / (V_H × f_sw × ΔI_L) = 48² / (400 × 100000 × 6.25)
            const result = BuckBoostCalculator.calculateLBoost(400, 48, 100000, 6.25);
            expect(result).toBeCloseTo(9.22, 2);
        });
    });

    describe('calculateLFinal', () => {
        test('计算最终电感取值', () => {
            const result = BuckBoostCalculator.calculateLFinal(26.9, 1.68, 1.2);
            expect(result).toBeCloseTo(32.28, 1);
        });

        test('使用默认裕量系数', () => {
            const result = BuckBoostCalculator.calculateLFinal(26.9, 1.68);
            expect(result).toBeCloseTo(32.28, 1);
        });
    });

    describe('calculateILPeak', () => {
        test('计算电感峰值电流', () => {
            const result = BuckBoostCalculator.calculateILPeak(20.83, 6.25);
            expect(result).toBeCloseTo(23.955, 2);
        });
    });

    describe('calculateISat', () => {
        test('计算饱和电流要求', () => {
            const result = BuckBoostCalculator.calculateISat(23.96);
            expect(result).toBeCloseTo(28.752, 2);
        });
    });

    describe('calculateISW', () => {
        test('计算开关管峰值电流', () => {
            const result = BuckBoostCalculator.calculateISW(20.83, 6.25);
            expect(result).toBeCloseTo(23.955, 2);
        });
    });

    describe('calculateISWRating', () => {
        test('计算开关管额定电流', () => {
            const result = BuckBoostCalculator.calculateISWRating(23.96, 5.5);
            expect(result).toBeCloseTo(35.94, 2);
        });
    });

    describe('calculateCO', () => {
        test('计算输出滤波电容', () => {
            // C_o = ΔI_L / (8 × f_sw × ΔV_o) = 6.25 / (8 × 100000 × 0.48) = 16.28 μF
            const result = BuckBoostCalculator.calculateCO(6.25, 100000, 0.48);
            expect(result).toBeCloseTo(16.28, 1);
        });

        test('fSw为0时应抛出错误', () => {
            expect(() => BuckBoostCalculator.calculateCO(6.25, 0, 0.48)).toThrow('开关频率必须大于0');
        });
    });

    describe('calculatePL', () => {
        test('计算电感铜损', () => {
            const result = BuckBoostCalculator.calculatePL(20.83, 0.01);
            expect(result).toBeCloseTo(4.34, 2);
        });

        test('使用默认DCR', () => {
            const result = BuckBoostCalculator.calculatePL(20.83);
            expect(result).toBeCloseTo(4.34, 2);
        });
    });

    describe('calculateFCrossover', () => {
        test('计算穿越频率', () => {
            const result = BuckBoostCalculator.calculateFCrossover(100000);
            expect(result).toBe(10000);
        });
    });

    describe('calculateAll - 综合测试', () => {
        test('文档示例：V_H=400V, V_L=48V, P_o=1000W, f_sw=100kHz, k=0.3', () => {
            const result = BuckBoostCalculator.calculateAll(400, 48, 1000, 100000, 0.3, 1.2);

            expect(result.dutyBuck).toBeCloseTo(0.12, 2);
            expect(result.dutyBoost).toBeCloseTo(0.88, 2);
            expect(result.iLAvgBuck).toBeCloseTo(20.83, 1);
            expect(result.iLAvgBoost).toBeCloseTo(2.5, 1);
            expect(result.iLAvg).toBeCloseTo(20.83, 1);
            expect(result.deltaIL).toBeCloseTo(6.25, 1);
            expect(result.lBuck).toBeCloseTo(67.58, 1);
            expect(result.lBoost).toBeCloseTo(9.22, 2);
            expect(result.lFinal).toBeCloseTo(81.10, 1);
            expect(result.iLPeak).toBeCloseTo(23.96, 1);
            expect(result.iSat).toBeCloseTo(28.75, 1);
            expect(result.iSWRating).toBeCloseTo(35.94, 1);
        });

        test('Boost模式场景：V_H=48V, V_L=12V, P_o=500W', () => {
            const result = BuckBoostCalculator.calculateAll(48, 12, 500, 100000, 0.3, 1.2);

            // 此时 V_H < V_L，应该是 Boost 模式
            expect(result.dutyBuck).toBeCloseTo(0.25, 2);
            expect(result.dutyBoost).toBeCloseTo(0.75, 2);
            expect(result.iLAvgBuck).toBeCloseTo(41.67, 1);
            expect(result.iLAvgBoost).toBeCloseTo(10.42, 1);
            expect(result.iLAvg).toBeCloseTo(41.67, 1);
        });
    });
});
