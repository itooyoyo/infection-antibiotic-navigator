import type { IvAdministration } from "../types/antibiotics.ts";

const checkedAt = "2026-07-17";
const unknownFlush = "前後フラッシュの要否は、院内ルート管理手順、配合変化表および薬剤部へ確認してください。";

export const ivAdministration: IvAdministration[] = [
  {
    drugId: "ceftriaxone", genericName: "セフトリアキソン", product: "セフトリアキソンNa静注用0.5g/1g（採用製剤を確認）", route: "静注・点滴静注",
    preparation: "採用製剤の電子添文に従って溶解・希釈してください。", reconstitution: "溶解液と液量は採用製剤の電子添文・インタビューフォームを確認してください。", dilution: "点滴静注では注射用水を使用せず、等張性を確保できる確認済み希釈液を使用してください。", concentration: "採用製剤資料を確認", infusionTime: "点滴静注は30分以上", rapidInjection: "静脈内大量投与はできるだけ緩徐に投与", normalSaline: "製剤別資料で、バイアル溶解・希釈・点滴バッグ・フラッシュの各用途を確認してください。", dextrose5: "製剤別資料を確認", sterileWater: "静注時の溶解可否は製剤別確認。点滴静注の希釈には使用しません。", incompatibleFluids: ["カルシウム含有注射剤・輸液", "硫酸塩を含む製剤"], incompatibleDrugs: ["他剤との混注は製剤別配合変化表を確認"], calciumCompatibility: "カルシウム含有注射剤・輸液とは配合しないでください。同時投与も避け、同一経路を使用する場合は院内手順と薬剤部へ確認してください。", sameLine: "Ca含有製剤との同時投与不可。切替時は適合する液でルート内を十分に置換することを検討してください。", ySite: "一律に可とせず、採用製剤の配合変化資料を確認", dedicatedLine: "Ca含有輸液使用時は別ルートを検討", preFlush: unknownFlush, postFlush: unknownFlush, flushFluid: "採用製剤と併用輸液に適合する液を薬剤部へ確認", lightProtection: "採用製剤資料を確認", stability: "調製後安定性は採用製剤資料を確認", storage: "採用製剤の電子添文を確認", source: "PMDA セフトリアキソンNa静注用0.5g/1g電子添文、PMDA安全性情報", checkedAt, notes: ["製造販売元・規格で調製法が異なるため採用製剤を確認"]
  },
  {
    drugId: "vancomycin", genericName: "バンコマイシン", product: "バンコマイシン塩酸塩点滴静注用0.5g/1g『明治』", route: "点滴静注",
    preparation: "0.5gは10mL、1gは20mLの注射用水・生理食塩液・5%ブドウ糖液のいずれかで溶解後、0.5gあたり100mL以上の割合で補液へ希釈。", reconstitution: "0.5g/10mL、1g/20mL", dilution: "0.5gあたり100mL以上の割合で補液に希釈", concentration: "血栓性静脈炎と投与時反応を避けるため濃度・速度に注意", infusionTime: "各投与を60分以上", rapidInjection: "急速静注・短時間点滴は行わない", normalSaline: "バイアル溶解に使用可能。希釈液として使用可能。", dextrose5: "バイアル溶解に使用可能。採用製剤資料で希釈可否を確認。", sterileWater: "バイアル溶解に使用可能", incompatibleFluids: ["採用製剤の配合変化表を確認"], incompatibleDrugs: ["他剤との混注可否は配合変化表を確認"], calciumCompatibility: "明確な一律記載を確認できないため製剤資料を確認", sameLine: "他剤切替時は配合変化表と院内ルート管理手順を確認", ySite: "データ不足。薬剤部へ確認", dedicatedLine: "血管外漏出・静脈炎リスクを踏まえルート管理を確認", preFlush: unknownFlush, postFlush: unknownFlush, flushFluid: "配合適合を確認した液", lightProtection: "採用製剤資料を確認", stability: "調製後は速やかに使用", storage: "採用製剤の電子添文を確認", source: "PMDA バンコマイシン塩酸塩点滴静注用0.5g/1g『明治』電子添文、抗菌薬TDM臨床実践ガイドライン2022", checkedAt, notes: ["腎機能・病態・TDMにより個別投与設計", "腎毒性と投与時反応を確認"]
  },
  {
    drugId: "daptomycin", genericName: "ダプトマイシン", product: "ダプトマイシン静注用350mg『サワイ』", route: "静注・点滴静注",
    preparation: "生理食塩液7mLをゆっくり加えて50mg/mLに溶解。激しく振とうせず約10分静置。点滴時はさらに生理食塩液で希釈。", reconstitution: "生理食塩液7mL", dilution: "点滴静注時は生理食塩液で希釈", concentration: "溶解後50mg/mL", infusionTime: "点滴静注は30分", rapidInjection: "成人では緩徐な静脈内注射が承認用法に含まれる。採用製剤の手順を確認。", normalSaline: "バイアル溶解、点滴希釈、前後フラッシュに使用可能", dextrose5: "ブドウ糖を含む希釈液とは配合不適", sterileWater: "この製剤では溶解液として指定されていないため使用しない", incompatibleFluids: ["ブドウ糖を含む希釈液"], incompatibleDrugs: ["他剤を同一輸液ラインから同時注入しない"], calciumCompatibility: "乳酸リンゲル液との配合可能を確認", sameLine: "他剤と連続投与する場合は生食または乳酸リンゲル液で前後フラッシュ", ySite: "他剤との同時注入は行わない", dedicatedLine: "同時投与時は専用ルートを検討", preFlush: "同一ルートで他剤と連続投与する場合は必須または強く推奨", postFlush: "同一ルートで他剤と連続投与する場合は必須または強く推奨", flushFluid: "生理食塩液または乳酸リンゲル液", lightProtection: "採用製剤資料を確認", stability: "調製開始後、室温25℃で12時間以内、2～8℃で48時間以内", storage: "調製後は速やかに使用", source: "PMDA ダプトマイシン静注用350mg『サワイ』電子添文", checkedAt, notes: ["不溶物がないことを目視確認", "製剤により注射用水が指定される場合があるため採用製剤を確認"]
  },
  {
    drugId: "linezolid", genericName: "リネゾリド", product: "リネゾリド点滴静注液600mg『日医工』300mLバッグ", route: "点滴静注",
    preparation: "調製不要の使い切りプレミックスバッグ。再溶解・追加希釈を行わない。", reconstitution: "不要", dilution: "不要。他の薬剤をバッグへ注入しない", concentration: "600mg/300mL", infusionTime: "30分～2時間", rapidInjection: "急速静注は行わない", normalSaline: "バッグへの添加不可。同一輸液チューブで連続投与する際の前後フラッシュに使用", dextrose5: "製剤がブドウ糖5%相当を含むプレミックス。追加混合はしない", sterileWater: "使用しない", incompatibleFluids: ["他の輸液・薬剤をバッグへ添加しない"], incompatibleDrugs: ["アムホテリシンB", "ジアゼパム", "フェニトインNa", "ST合剤", "セフトリアキソンNa等"], calciumCompatibility: "一律に可とせず採用製剤資料を確認", sameLine: "他剤とは別々に投与。連続投与時は前後に生食を流す", ySite: "一律に可とせず、配合禁忌一覧と薬剤部へ確認", dedicatedLine: "同時投与を避け別投与を推奨", preFlush: "同一輸液チューブで他剤と連続投与する場合は強く推奨", postFlush: "同一輸液チューブで他剤と連続投与する場合は強く推奨", flushFluid: "生理食塩液", lightProtection: "外袋は品質保持のため使用時まで開封しない", stability: "開封・残液再使用不可", storage: "外袋のまま採用製剤の条件で保存", source: "PMDA リネゾリド点滴静注液600mg『日医工』電子添文", checkedAt, notes: ["U字管連結を行わない", "残液を使用しない"]
  },
];

export const administrationFallback = (drugId: string, genericName: string): IvAdministration => ({
  drugId, genericName, product: "採用製剤を確認", route: "注射剤", preparation: "採用製剤の電子添文・インタビューフォームを確認", reconstitution: "確認済みデータ未登録", dilution: "確認済みデータ未登録", concentration: "確認済みデータ未登録", infusionTime: "採用製剤・適応・院内プロトコルを確認", rapidInjection: "可否を推測せず採用製剤を確認", normalSaline: "バイアル溶解・希釈・バッグ・フラッシュを用途別に薬剤部へ確認", dextrose5: "データ不足", sterileWater: "データ不足", incompatibleFluids: ["配合変化資料を確認"], incompatibleDrugs: ["他剤との混注は不可として扱い、確認後に判断"], calciumCompatibility: "データ不足", sameLine: "院内ルート管理手順を確認", ySite: "データ不足", dedicatedLine: "同時投与が必要な場合は薬剤部へ確認", preFlush: unknownFlush, postFlush: unknownFlush, flushFluid: "適合する液を薬剤部へ確認", lightProtection: "採用製剤資料を確認", stability: "採用製剤資料を確認", storage: "採用製剤資料を確認", source: "確認済み一次資料未登録", checkedAt, notes: ["具体的数値を推測して表示しません"]
});
