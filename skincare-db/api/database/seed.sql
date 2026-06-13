-- ============================================================
-- 初始種子資料 (Seed Data)
-- ============================================================

-- 膚質
INSERT INTO skin_types (name, description, characteristics, common_concerns) VALUES
('乾性肌', '皮脂分泌不足，皮膚缺水', ARRAY['緊繃感','脫皮','細紋明顯','毛孔細小'], ARRAY['乾燥','暗沉','細紋','脫皮']),
('油性肌', '皮脂分泌旺盛', ARRAY['T字部位出油','毛孔粗大','易長痘','光澤感強'], ARRAY['痘痘','黑頭','毛孔問題','出油']),
('混合性肌', 'T字偏油、兩頰偏乾', ARRAY['T字出油','臉頰正常至乾燥','毛孔大小不均'], ARRAY['出油控制','保濕平衡']),
('敏感性肌', '皮膚屏障較脆弱，易受刺激', ARRAY['易泛紅','刺痛感','對成分敏感','乾燥'], ARRAY['泛紅','刺激反應','乾燥','屏障修復']),
('正常肌', '皮脂水分均衡', ARRAY['水油平衡','毛孔細緻','膚色均勻'], ARRAY['日常保養','抗老預防'])
ON CONFLICT (name) DO NOTHING;

-- 常見成分
INSERT INTO ingredients (name, inci_name, category, description, benefits, concerns, origin, comedogenic_rating, irritation_risk) VALUES
('玻尿酸', 'Sodium Hyaluronate', '保濕劑', '天然存在於人體皮膚中的多醣體，強力吸水保濕', ARRAY['深層保濕','促進皮膚彈性','填補細紋'], ARRAY[]::TEXT[], '生物發酵', 0, 'low'),
('菸鹼醯胺', 'Niacinamide', '功效成分', '維生素B3衍生物，多重肌膚功效', ARRAY['縮毛孔','美白提亮','控油','抗老','強化屏障'], ARRAY['高濃度可能刺激'],'合成', 0, 'low'),
('水楊酸', 'Salicylic Acid', '角質溶解劑', '油溶性Beta羥基酸，深層清潔毛孔', ARRAY['去角質','疏通毛孔','抗痘','控油'], ARRAY['可能乾燥','孕婦慎用'], '合成', 0, 'moderate'),
('視黃醇', 'Retinol', '功效成分', '維生素A衍生物，最知名的抗老成分', ARRAY['促進細胞代謝','淡化細紋','改善暗沉','縮毛孔'], ARRAY['光敏感性','刺激性','孕婦禁用'], '合成', 2, 'high'),
('乳木果油', 'Butyrospermum Parkii Butter', '潤膚劑', '非洲乳木果提取的天然植物油脂', ARRAY['深層滋潤','修復乾燥','軟化肌膚'], ARRAY[]::TEXT[], '天然', 0, 'low'),
('神經醯胺', 'Ceramide NP', '屏障修復', '皮膚天然存在的脂質，維持皮膚屏障完整性', ARRAY['修復屏障','鎖水','減少敏感'], ARRAY[]::TEXT[], '合成', 0, 'low'),
('AHA果酸', 'Glycolic Acid', '角質溶解劑', '甘蔗提取的水溶性Alpha羥基酸', ARRAY['去角質','提亮膚色','促進膠原蛋白'], ARRAY['光敏感性','可能刺激'], '半合成', 0, 'moderate'),
('維生素C', 'Ascorbic Acid', '抗氧化劑', '強效抗氧化及美白成分', ARRAY['美白','抗氧化','促進膠原蛋白','提亮'], ARRAY['不穩定','可能刺激'], '半合成', 0, 'moderate'),
('積雪草萃取', 'Centella Asiatica Extract', '舒緩成分', '亞洲草本植物萃取，傳統用於傷口癒合', ARRAY['舒緩修復','消炎','強化屏障','抗老'], ARRAY[]::TEXT[], '天然', 0, 'low'),
('防曬劑Zinc Oxide', 'Zinc Oxide', '防曬劑', '物理性防曬成分，廣譜UVA/UVB防護', ARRAY['廣譜防曬','舒緩抗炎','適合敏感肌'], ARRAY['可能泛白'], '礦物', 0, 'low')
ON CONFLICT DO NOTHING;

-- 保養方式
INSERT INTO care_methods (name, category, description, steps, frequency, time_of_day, target_concerns) VALUES
('基礎早間護膚程序', '日間保養', '適合日常早晨的基礎保養流程',
 '[{"step":1,"action":"卸妝/潔面","product_type":"洗面乳","duration":"60秒"},{"step":2,"action":"化妝水","product_type":"化妝水","duration":"拍打吸收"},{"step":3,"action":"精華液","product_type":"精華液","duration":"輕拍吸收"},{"step":4,"action":"乳液/面霜","product_type":"乳液","duration":"均勻塗抹"},{"step":5,"action":"防曬","product_type":"防曬","duration":"全臉均勻"}]'::jsonb,
 '每日', 'morning', ARRAY['日常保養','防曬保護']),
('基礎晚間護膚程序', '夜間保養', '夜間修復保養完整流程',
 '[{"step":1,"action":"卸妝","product_type":"卸妝油/卸妝水","duration":"充分乳化"},{"step":2,"action":"洗臉","product_type":"洗面乳","duration":"60秒"},{"step":3,"action":"化妝水","product_type":"化妝水","duration":"化妝棉濕敷"},{"step":4,"action":"精華液","product_type":"精華液","duration":"輕拍"},{"step":5,"action":"面霜","product_type":"面霜","duration":"均勻塗抹"}]'::jsonb,
 '每日', 'evening', ARRAY['修復','保濕','抗老']),
('深層清潔面膜', '特殊護理', '每週深層清潔毛孔',
 '[{"step":1,"action":"清潔後敷面膜","product_type":"深層清潔面膜","duration":"10-15分鐘"},{"step":2,"action":"沖洗","duration":"徹底沖乾淨"},{"step":3,"action":"化妝水舒緩","product_type":"化妝水"}]'::jsonb,
 '每週1-2次', 'evening', ARRAY['毛孔清潔','去角質']),
('視黃醇抗老程序', '抗老護理', '使用視黃醇的循序漸進抗老方法',
 '[{"step":1,"action":"晚間潔面","product_type":"溫和洗面乳"},{"step":2,"action":"化妝水補水"},{"step":3,"action":"塗抹視黃醇","product_type":"視黃醇精華","notes":"從低濃度開始"},{"step":4,"action":"保濕鎖水","product_type":"滋潤面霜"}]'::jsonb,
 '每週2-3次(初期)', 'evening', ARRAY['抗老','細紋','暗沉']);

-- 環境資料
INSERT INTO environmental_profiles (name, biodegradability, ecotoxicity_risk, is_cruelty_free, is_vegan, is_reef_safe, certifications) VALUES
('標準環保友善', 'readily', 'low', TRUE, TRUE, TRUE, ARRAY['Leaping Bunny','PETA']),
('礁石安全防曬', 'readily', 'low', TRUE, FALSE, TRUE, ARRAY['Reef Safe認證']),
('一般商業配方', 'inherently', 'moderate', FALSE, FALSE, FALSE, ARRAY[]::TEXT[])
ON CONFLICT DO NOTHING;
