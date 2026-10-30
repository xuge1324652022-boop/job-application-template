/*
 * `chapterSchedule()` 的纯函数单测 —— `/photo` 五章固定舞台的推进节奏全压在这一个函数上，
 * 用端到端脚本（outputs/verify-photo-page.cjs）测它得跑一遍浏览器，反馈太慢。
 *
 * 用途：验证「每章先停留 hold → 走完全部照片 → 再停留 hold」这条时序在
 *       各种屏高（480 / 720 / 900）和退化输入（零张、单张、空章）下都成立，
 *       并且下一章的遮罩（wipe）**绝不**提前进入 —— 提前进入会让上一章最后一张
 *       被盖住一半，正是端到端脚本很难稳定复现的那类问题。
 *
 * 触发：手动跑 `node scripts/verify-photo-story.mjs`（不注册进 outputs/ 套件，
 *       因为它不起浏览器，跑不进 `_run-all-verify.cjs` 的 guard() 约定）。
 *       改了 `src/utils/photoStory.ts` 必须跑它。
 *
 * 验收：末行打印 `PASS: ...`、退出码 0；任一 assert 失败会直接抛错并以非 0 退出。
 */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import ts from 'typescript'
const transpile = path => ts.transpile(
  fs.readFileSync(new URL(path, import.meta.url), 'utf8'),
  { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
)
const load = async path => import(
  `data:text/javascript;base64,${Buffer.from(transpile(path)).toString('base64')}`,
)
const { chapterSchedule } = await load('../src/utils/photoStory.ts')
// photoStory 不再自带 unit 副本，统一用 utils/clamp 的真实现来做期望值。
const { clamp } = await load('../src/utils/clamp.ts')
for (const height of [480, 720, 900]) {
  for (const distances of [[3500, 2600, 1800, 3200, 300], [0, 0], [400]]) {
    const chapters = chapterSchedule(distances, height)
    assert.equal(chapters.length, distances.length, '一章一张，不得多出或少掉章节')
    chapters.forEach((chapter, i) => {
      assert.equal(chapter.end - chapter.start, distances[i])
      assert.ok(chapter.finish > chapter.end, 'last photo has a reading hold')
      if (i) {
        assert.equal(chapter.enter, chapters[i - 1].finish)
        assert.ok(chapter.enter > chapters[i - 1].end, 'next mask starts only after final photo')
        assert.equal(clamp((chapters[i - 1].end - chapter.enter) / chapter.wipe), 0)
        assert.equal(clamp((chapter.start - chapter.enter) / chapter.wipe), 1)
      }
    })
  }
}
assert.deepEqual([-1, 0, .5, 1, 2].map(v => clamp(v)), [0, 0, .5, 1, 1])
console.log('PASS: chapter completion, mask ordering, zero overflow, viewport sizes and clamp boundaries')
