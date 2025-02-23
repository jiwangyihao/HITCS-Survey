<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue'
import { competitions } from './data/competition'
import * as fflate from 'fflate'

import Panel from 'primevue/panel'
import Fieldset from 'primevue/fieldset'
import RadioButtonGroup from 'primevue/radiobuttongroup'
import RadioButton from 'primevue/radiobutton'
import FloatLabel from 'primevue/floatlabel'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import ScrollPanel from 'primevue/scrollpanel'
import Select from 'primevue/select'
import Divider from 'primevue/divider'
import Checkbox from 'primevue/checkbox'
import Textarea from 'primevue/textarea'
import TreeSelect from 'primevue/treeselect'
import Rating from 'primevue/rating'

type Module =
  | '创新创业'
  | '数学建模与数据科学'
  | '算法设计'
  | '软件工程'
  | '操作系统'
  | '人工智能'
  | '物联网工程'
  | '信息安全'
  | '电子信息类'
  | '其他学科'

const state = reactive({
  verify: '',
  timestamp: Date.now(),
  name: '',
  number: '',
  learning: '',
  competitions: competitions.map((competition) => ({
    id: competition.id,
    module: competition.category as Module,
  })),
  rating: {
    创新创业: [] as { id: string; rating: number }[],
    数学建模与数据科学: [] as { id: string; rating: number }[],
    算法设计: [] as { id: string; rating: number }[],
    软件工程: [] as { id: string; rating: number }[],
    操作系统: [] as { id: string; rating: number }[],
    人工智能: [] as { id: string; rating: number }[],
    物联网工程: [] as { id: string; rating: number }[],
    信息安全: [] as { id: string; rating: number }[],
    电子信息类: [] as { id: string; rating: number }[],
    其他学科: [] as {
      id: string
      rating: number
      relativity: Record<Exclude<Module, '其他学科'>, number>
      relativeReason: string
    }[],
  },
  participated: [] as { id: string; progress: string; rating: number; reason: string }[],
  advice: '',
})

const categoriedCompetitions = computed(() => {
  const result: Partial<Record<Module, typeof state.competitions>> = {}
  state.competitions.forEach((competition) => {
    if (!result[competition.module]) {
      result[competition.module] = []
    }
    result[competition.module]?.push(competition)
  })
  return result
})

watchEffect(() => {
  for (const [module, competitions] of Object.entries(categoriedCompetitions.value)) {
    const rating = competitions.map((competition) => {
      return {
        id: competition.id,
        rating: -1,
        relativity: {
          创新创业: -1,
          数学建模与数据科学: -1,
          算法设计: -1,
          软件工程: -1,
          操作系统: -1,
          人工智能: -1,
          物联网工程: -1,
          信息安全: -1,
          电子信息类: -1,
        },
        relativeReason: '',
      }
    })
    state.rating[module as Module] = rating
  }
})

watchEffect(() => {
  for (const [module, competitions] of Object.entries(state.rating)) {
    const sorted = competitions.sort((a, b) => 1 / b.rating - 1 / a.rating)
    if (module === '其他学科') {
      state.rating[module] = sorted as (typeof state.rating)['其他学科']
    } else {
      state.rating[module as Exclude<Module, '其他学科'>] = sorted
    }
  }
})

const competitionTree = computed(() => {
  interface Node {
    label: string
    data?: { id: string; progress: string; rating: number; reason: string }
    children?: Node[]
  }
  const tree: Node[] = []
  state.competitions.forEach((competition) => {
    if (tree.find((node) => node.label === competition.module)) {
      tree
        .find((node) => node.label === competition.module)
        ?.children!.push({
          label: competitions.find((comp) => competition.id === comp.id)!.name,
          data: {
            id: competition.id,
            progress: '',
            rating: 0,
            reason: '',
          },
        })
    } else {
      tree.push({
        label: competition.module,
        children: [
          {
            label: competitions.find((comp) => competition.id === comp.id)!.name,
            data: {
              id: competition.id,
              progress: '',
              rating: 0,
              reason: '',
            },
          },
        ],
      })
    }
  })
  return tree.map((node, index) => {
    return {
      key: `${index}`,
      label: node.label,
      selectable: false,
      children: node.children!.map((child, i) => {
        return {
          key: `${index}-${i}`,
          label: child.label,
          data: child.data,
        }
      }),
    }
  })
})

const stateResult = computed(() => {
  const buf = fflate.strToU8(JSON.stringify(state))

  const compressed = fflate.compressSync(buf, {
    level: 9,
  })

  return btoa(fflate.strFromU8(compressed, true))
})

const verifyLoading = ref(false)
const verifyDisabled = ref(false)
const verifyInvalid = ref(false)

function verify() {
  verifyLoading.value = true
  verifyInvalid.value = false
  fetch('https://today.hit.edu.cn')
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return response.text()
    })
    .then(async (html) => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')
      const key =
        doc.querySelector(
          '.node > div > div > .row:nth-of-type(3) .block-region-top-left-below .tab-pane:nth-of-type(1) li > span > a',
        )!.innerHTML +
        '\n' +
        doc.querySelector(
          '.node > div > div > .row:nth-of-type(3) .block-region-top-right-below .tab-pane:nth-of-type(1) li > span > a',
        )!.innerHTML +
        '\n' +
        state.timestamp
      const jwkKey = {
        alg: 'RSA-OAEP-256',
        e: 'AQAB',
        ext: true,
        key_ops: ['encrypt'],
        kty: 'RSA',
        n: 'zQP5hs4cqEpAHuXQ_Cx7J330b26h5igV2VYncRqHXdgLzRNmSQrvJCGo-tdT-F-T-si2ZUfAEV-w21LWC7Ql0A6pOWPEJdCbqx18xqMuVL6eibqnRhRqtrzz9Gb465Kv3N4G5YCjShufEQInmtuwG59m3DipxwpV5gpFyNZ5qjLemE7gCSXvLcd2piqX0oI9wXoZxoKejss32zAVKk6HzPA8l1ivxv3R5SwU81bumKCBVwY5_RZ5GA2dZGqwidmHD54ZbEtHp51yfLcige2X2qILneGu2HMRdXKErok26Qp3CwN8Y4vmWBaX-_YzCxfMA1VPH_EmUhh-IXRhqdpf10ba8ogoJSm8aHfiweyKEnYcYWTbflXuP6vY3EpYaL59fZBQsM5gE4XRViR9Nemp4bhPpqK8lTWcrZTa6gdKo8baCbaZgLmH8nh0lhU5w9ChPD9EyccdbZODErcgN2fH5FJudl8DZCuh_72lGg3zAAdSnlAhUv815Im9KJGBBkZZt6M1lmYt8_em3a29Y2wLVJqP4Y25aerb_WbFVpbNNpmKcH9CvRqxsnZaGgoY65ZPchwOjSCSO6nHHtRY1dX-dA2mM6myOmJQl3463aLGqv-CbKKuG9zMt7dxxuqR75gBwZawxk8EHraMy87Y1ympGl-C_rSS10hezS___yq8f-8',
      }
      const cryptoKey = await window.crypto.subtle.importKey(
        'jwk',
        jwkKey,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt'],
      )
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'RSA-OAEP' },
        cryptoKey,
        new TextEncoder().encode(key),
      )
      const encryptedString = btoa(String.fromCharCode(...new Uint8Array(encrypted)))
      console.log(encryptedString)
      state.verify = encryptedString
      verifyDisabled.value = true
      verifyLoading.value = false
    })
    .catch((_error) => {
      verifyLoading.value = false
      verifyInvalid.value = true
    })
}

const basicVerify = computed(() => !!state.name && !!state.number && !!state.verify)

const learningVerify = computed(() => state.learning && basicVerify.value)

const moduleVerify = computed(
  () => state.competitions.every((competition) => competition.module) && learningVerify.value,
)

const othersVerify = computed(
  () =>
    ((state.rating.其他学科.some((competition) => competition.rating > 0) &&
      state.rating.其他学科
        .filter((competition) => competition.rating > 0)
        .every(
          (competition) =>
            Object.entries(competition.relativity).some(([_, rating]) => rating > 0) &&
            competition.relativeReason.length >= 10,
        )) ||
      state.learning === 'none') &&
    moduleVerify.value,
)

const ratingVerify = computed(
  () =>
    Object.entries(state.rating)
      .filter(([module]) => module !== '其他学科')
      .every(([_, comps]) => comps.every((competition) => competition.rating > 0)) &&
    othersVerify.value,
)

const participatedVerify = computed(
  () =>
    ((state.participated.length > 0 &&
      state.participated.every(
        (competition) =>
          competition.progress &&
          competition.rating > 0 &&
          (competition.rating < 3 ? competition.reason.length >= 10 : true),
      )) ||
      state.learning === 'none') &&
    ratingVerify.value,
)

const scrollTop = ref(window.scrollY)
window.addEventListener('scroll', () => {
  scrollTop.value = window.scrollY
})
</script>

<template>
  <header :class="scrollTop === 0 ? 'top' : ''">
    <nav>
      <a class="name" href="https://github.com/jiwangyihao/HITCS-Survey">
        <img src="/logo.png" alt="" />
        <span class="clip">哈尔滨工业大学计算学部学科竞赛调研问卷</span>
      </a>
      <a href="https://github.com/jiwangyihao/HITCS-Survey" style="padding: 0 12px">
        <img src="https://img.shields.io/github/stars/jiwangyihao/HITCS-Survey" alt="star" style="height: auto" />
      </a>
    </nav>
  </header>
  <main class="layout-content">
    <Panel>
      <template #header>
        <h1 class="title clip text-center">哈尔滨工业大学计算学部学科竞赛调研问卷</h1>
      </template>
      <Fieldset legend="问卷说明">
        <p>亲爱的同学，您好！</p>
        <p>本问卷旨在了解哈尔滨工业大学计算学部的同学们对目前主要的各类学科竞赛的评价与建议。</p>
        <p>请认真阅读每个问题并根据实际情况填写，您的意见对我们非常宝贵。</p>
      </Fieldset>
      <Fieldset legend="基本信息*">
        <h3><span class="text-bold">00</span> 基本信息采集</h3>
        <p class="subtitle">本题组仅用于筛选有效信息，请如实填写，我们将严格保密您的个人信息。</p>
        <div class="flex flex-wrap gap-2 mt-4">
          <FloatLabel variant="on">
            <InputText v-model="state.name" id="name" />
            <label for="name">姓名</label>
          </FloatLabel>
          <FloatLabel variant="on">
            <InputText v-model="state.number" id="number" />
            <label for="number">学号</label>
          </FloatLabel>
          <Button type="button" :label="verifyLoading
              ? '正在验证校园网环境......'
              : verifyDisabled
                ? '验证成功'
                : verifyInvalid
                  ? '验证失败，请检查校园网后重试'
                  : '请先验证校园网环境'
            " @click="verify" :loading="verifyLoading" :disabled="verifyDisabled"
            :severity="verifyInvalid ? 'danger' : verifyDisabled ? 'success' : ''" />
        </div>
      </Fieldset>
      <Fieldset legend="单选题*" v-if="basicVerify">
        <h3><span class="text-bold">01</span> 请给出你认为的自己对各类科创竞赛的了解程度</h3>
        <p class="subtitle highlight">
          注意：选择不同选项可能会影响你的作答在最终评价中的权重及你看到的题目数量
        </p>
        <RadioButtonGroup name="learning" class="flex gap-4 flex-col mt-4" v-model="state.learning">
          <div class="flex items-center gap-2">
            <RadioButton inputId="learning-very" value="very" />
            <label for="learning-very">
              非常了解（知晓较多比赛的侧重点、规则、参赛经历丰富、有过现场赛/获奖经历等）
            </label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton inputId="learning-relatively" value="relatively" />
            <label for="learning-relatively">
              比较了解（知晓部分比赛的侧重点、规则、参赛经历较多、有过答辩经历等）
            </label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton inputId="learning-average" value="average" />
            <label for="learning-average">
              一般了解（知晓少数比赛的侧重点、规则，大部分比赛“只闻其名”，参赛经历较少）
            </label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton inputId="learning-limited" value="limited" />
            <label for="learning-limited">
              不太了解（大部分比赛“只闻其名”，参赛经历较少）<br />
              <span class="highlight">
                注意：选择该选项会较大影响你的作答在最终评价中的权重，同时导致你后续可回答的问题数量变少
              </span>
            </label>
          </div>
          <div class="flex items-center gap-2">
            <RadioButton inputId="learning-none" value="none" />
            <label for="learning-none">
              不了解（不关心科创竞赛，没有参赛经历）<br />
              <span class="highlight">
                注意：选择该选项会严重影响你的作答在最终评价中的权重，同时导致你后续可回答的问题数量明显变少
              </span>
            </label>
          </div>
        </RadioButtonGroup>
      </Fieldset>
      <Fieldset legend="矩阵选择题*" v-if="learningVerify && !['none', 'limited'].includes(state.learning)">
        <h3>
          <span class="text-bold">02</span>
          从计算机的学科视角来看，你认为下列竞赛应该被划分至哪个细分模块？
        </h3>
        <p class="subtitle">模块划分：</p>
        <ul class="subtitle">
          <li>创新创业：实现物体互联互通的工程应用。</li>
          <li>数学建模与数据科学：用数学方法解决实际问题。</li>
          <!-- TODO: 增加数据科学部分 -->
          <li>算法设计：设计高效可靠的算法解决计算问题。</li>
          <li>软件工程：系统地开发和维护软件。</li>
          <li>操作系统：管理计算机硬件和软件资源的核心软件。</li>
          <li>人工智能：研究开发用于模拟、延伸和扩展人类智能的理论、方法和技术的科学。</li>
          <li>物联网工程：实现物体互联互通的工程应用。</li>
          <li>信息安全：保护信息的机密性、完整性和可用性。</li>
          <li>电子信息类：涉及电子技术和信息技术的学科领域。</li>
          <li>其他学科：与计算机学科不直接相关的其他学科或领域。</li>
        </ul>
        <p class="subtitle">
          出于方便填答考虑，所有比赛（赛道）均已根据笔者对相关比赛的了解被分配了一个初始值，您可以根据您对比赛的了解改变您认为不妥的划分。
        </p>
        <div class="card mt-4">
          <ScrollPanel class="w-full" style="height: 200px">
            <template v-for="(competition, index) in state.competitions" :key="competition.id">
              <Divider v-if="index > 0" />
              <div class="flex gap-2 items-center">
                <label>{{competitions.find((comp) => competition.id === comp.id)?.name}}</label>
                <span class="flex-grow"></span>
                <Select v-model="competition.module" :options="[
                  '创新创业',
                  '数学建模与数据科学',
                  '算法设计',
                  '软件工程',
                  '操作系统',
                  '人工智能',
                  '物联网工程',
                  '信息安全',
                  '电子信息类',
                  '其他学科',
                ]" placeholder="请选择对应的模块" />
              </div>
            </template>
          </ScrollPanel>
        </div>
      </Fieldset>
      <Fieldset legend="顺序多选题*" v-if="moduleVerify && state.learning !== 'none'">
        <h3>
          <span class="text-bold">03</span>
          请选择下列模块被标注为【其他学科】的比赛中你认为与计算机结合度较高的
        </h3>
        <p class="subtitle">按照相关度从高到低选择。</p>
        <p class="highlight">本题需要至少选择一项<span v-if="['none', 'limited', 'average'].includes(state.learning)" class="highlight">，最多选三项</span></p>
        <p class="highlight">注意：每选择一个选项，你都需要提供相应的理由。</p>
        <TransitionGroup class="flex gap-4 flex-col mt-4" name="list" tag="div">
          <div v-for="competition in state.rating.其他学科" :key="competition.id" class="flex items-center gap-2">
            <Checkbox :inputId="`others_rating_${competition.id}`" :value="true" @update:modelValue="
              (value) => {
                if (value.length > 0) {
                  competition.rating =
                    Math.max(...state.rating.其他学科.map((comp) => comp.rating), 0) + 1
                  for (const [module, _relativity] of Object.entries(competition.relativity)) {
                    competition.relativity[module as Exclude<Module, '其他学科'>] = -1
                  }
                } else {
                  state.rating.其他学科.forEach((comp) => {
                    if (comp.rating > competition.rating) {
                      comp.rating--
                    }
                  })
                  competition.rating = -1
                }
              }
            " :disabled=" ['none', 'limited', 'average'].includes(state.learning)&& Math.max(...state.rating.其他学科.map((comp) => comp.rating), 0) >= 3 && competition.rating===-1">
              <template #icon="{ checked }">
                <span class="p-checkbox-icon p-icon" style="width: unset; height: unset" v-if="checked">
                  {{ competition.rating }}
                </span>
              </template>
            </Checkbox>
            <label :for="`others_rating_${competition.id}`">
              {{competitions.find((comp) => competition.id === comp.id)?.name}}
            </label>
          </div>
        </TransitionGroup>
      </Fieldset>
      <template v-for="(competition, index) in state.rating.其他学科.filter((comp) => comp.rating > 0)"
        :key="competition.id">
        <Fieldset legend="顺序多选题*">
          <h3>
            <span class="text-bold">04.{{ index + 1 }}</span>
            你认为【{{
              competitions.find((comp) => competition.id === comp.id)?.name
            }}】与计算机中的哪个专业模块结合度较高
          </h3>
          <p class="subtitle">按照相关度从高到低选择</p>
          <p class="highlight">本题需要至少选择一项。</p>
          <TransitionGroup class="flex gap-4 flex-col mt-4" name="list" tag="div">
            <div v-for="[module, rating] in Object.entries(competition.relativity)
              .filter(([module, relativity]) => !!module && module !== 'undefined')
              .sort((a, b) => 1 / b[1] - 1 / a[1])" :key="module" class="flex items-center gap-2">
              <Checkbox :inputId="`others_relative_${competition.id}_${module}`" :value="true" @update:modelValue="
                (value) => {
                  if (value.length > 0) {
                    competition.relativity[module as Exclude<Module, '其他学科'>] =
                      Math.max(
                        ...Object.entries(competition.relativity).map((rela) => rela[1]),
                        0,
                      ) + 1
                  } else {
                    Object.entries(competition.relativity).forEach(([m, _rating]) => {
                      if (
                        competition.relativity[m as Exclude<Module, '其他学科'>] >
                        competition.relativity[module as Exclude<Module, '其他学科'>]
                      ) {
                        competition.relativity[m as Exclude<Module, '其他学科'>]--
                      }
                    })
                    competition.relativity[module as Exclude<Module, '其他学科'>] = -1
                  }
                }
              ">
                <template #icon="{ checked }">
                  <span class="p-checkbox-icon p-icon" style="width: unset; height: unset" v-if="checked">
                    {{ rating }}
                  </span>
                </template>
              </Checkbox>
              <label :for="`others_relative_${competition.id}_${module}`">
                {{ module }}
              </label>
            </div>
          </TransitionGroup>
        </Fieldset>
        <Fieldset legend="问答题*">
          <h3>
            <span class="text-bold">05.{{ index + 1 }}</span>
            请给出你认为【{{
              competitions.find((comp) => competition.id === comp.id)?.name
            }}】与计算机结合度较高的具体理由
          </h3>
          <p class="subtitle">建议从计算机专业模块在该比赛中的实际作用进行说明</p>
          <p class="highlight">本题理由不少于10个字。</p>
          <div class="flex gap-2 mt-4">
            <FloatLabel variant="on" class="w-full">
              <Textarea v-model="competition.relativeReason" rows="5" autoResize
                :id="`others_relative_reason_${competition.id}`" class="w-full" :invalid="competition.relativeReason.length > 0 && competition.relativeReason.length < 10
                  " />
              <label :for="`others_relative_reason_${competition.id}`">理由</label>
            </FloatLabel>
          </div>
        </Fieldset>
      </template>
      <template v-if="othersVerify">
        <Fieldset legend="排序题*" v-for="([module, comps], index) in Object.entries(state.rating).filter(
          ([module]) => module !== '其他学科',
        )" :key="module">
          <h3>
            <span class="text-bold">06.{{ index + 1 }}</span>
            请按照你认为的各比赛含金量为下面模块被标注为【{{ module }}】的比赛排序
          </h3>
          <p class="subtitle">按照你的主观感受排序即可</p>
          <p class="highlight">本题为排序题，需要选择所有选项。</p>
          <TransitionGroup class="flex gap-4 flex-col mt-4" name="list" tag="div">
            <div v-for="competition in comps" :key="competition.id" class="flex items-center gap-2">
              <Checkbox :inputId="`modules_rating_${competition.id}`" :value="true" @update:modelValue="
                (value) => {
                  if (value.length > 0) {
                    competition.rating = Math.max(...comps.map((comp) => comp.rating), 0) + 1
                  } else {
                    comps.forEach((comp) => {
                      if (comp.rating > competition.rating) {
                        comp.rating--
                      }
                    })
                    competition.rating = -1
                  }
                }
              ">
                <template #icon="{ checked }">
                  <span class="p-checkbox-icon p-icon" style="width: unset; height: unset" v-if="checked">
                    {{ competition.rating }}
                  </span>
                </template>
              </Checkbox>
              <label :for="`modules_rating_${competition.id}`">
                {{competitions.find((comp) => competition.id === comp.id)?.name}}
              </label>
            </div>
          </TransitionGroup>
        </Fieldset>
      </template>
      <Fieldset legend="多选题*" v-if="ratingVerify && state.learning !== 'none'">
        <h3>
          <span class="text-bold">07</span>
          请选出你参加过的比赛
        </h3>
        <p class="subtitle">
          请勾选您<span class="highlight">实际报名并参与过</span>的比赛（无论是否晋级或获奖）
        </p>
        <p class="highlight">本题需要至少选择一项。</p>
        <TreeSelect :options="competitionTree" selectionMode="checkbox" filter filterMode="strict" display="chip"
          placeholder="选择比赛，支持筛选" fluid class="mt-4" showClear @change="
            (value) => {
              state.participated =
                Object.entries(value)
                  .filter(([id]) => /-/.test(id))
                  .map(
                    ([id]) =>
                      competitionTree
                        .find((node) => node.key === id.split('-')[0])!
                        .children!.find((child) => child.key === id)!.data!,
                  ) || []
            }
          " />
      </Fieldset>
      <template v-for="(competition, index) in state.participated" :key="competition.id">
        <Fieldset legend="单选题*">
          <h3>
            <span class="text-bold">08.{{ index + 1 }}</span>
            请选择【{{
              competitions.find((comp) => competition.id === comp.id)?.name
            }}】中你最终进入的比赛阶段
          </h3>
          <p class="subtitle">请根据您实际参与并晋级的最高阶段进行选择（即使在该阶段被淘汰）</p>
          <RadioButtonGroup :name="`progress-${competition.id}`" class="flex gap-4 flex-col mt-4"
            v-model="competition.progress">
            <div class="flex items-center gap-2">
              <RadioButton :inputId="`national-awarded-${competition.id}`" value="national-awarded" />
              <label :for="`national-awarded-${competition.id}`"> 国赛获奖 </label>
            </div>
            <div class="flex items-center gap-2">
              <RadioButton :inputId="`national-${competition.id}`" value="national" />
              <label :for="`national-${competition.id}`"> 国赛入围 </label>
            </div>
            <div class="flex items-center gap-2">
              <RadioButton :inputId="`provincial-${competition.id}`" value="provincial" />
              <label :for="`provincial-${competition.id}`"> 区域赛/省赛入围 </label>
            </div>
            <div class="flex items-center gap-2">
              <RadioButton :inputId="`preliminary-${competition.id}`" value="preliminary" />
              <label :for="`preliminary-${competition.id}`"> 初赛（未入围区域赛） </label>
            </div>
          </RadioButtonGroup>
        </Fieldset>
        <Fieldset legend="单选题*">
          <h3>
            <span class="text-bold">09.{{ index + 1 }}</span>
            请给出你对【{{
              competitions.find((comp) => competition.id === comp.id)?.name
            }}】的主观评价（1-5分）
          </h3>
          <p class="subtitle">获得填写者对竞赛的评价（组织度、难度、参与人数等）</p>
          <Rating v-model="competition.rating" class="mt-4" />
        </Fieldset>
        <Fieldset legend="问答题*" v-if="competition.rating < 3 && competition.rating > 0">
          <h3>
            <span class="text-bold">10.{{ index + 1 }}</span>
            请给出你对【{{
              competitions.find((comp) => competition.id === comp.id)?.name
            }}】主观评价较低的原因
          </h3>
          <p class="subtitle">规则设置、组织安排、题目难度与合理性、评判标准等</p>
          <p class="highlight">本题理由不少于10个字。</p>
          <FloatLabel variant="on" class="mt-4">
            <Textarea v-model="competition.reason" rows="5" autoResize fluid
              :invalid="competition.reason.length < 10 && competition.reason.length > 0" />
            <label>请填写具体原因</label>
          </FloatLabel>
        </Fieldset>
      </template>
      <Fieldset legend="问答题" v-if="participatedVerify">
        <h3>
          <span class="text-bold">11</span>
          请给出你对当前学部科创竞赛相关政策的建议
        </h3>
        <p class="subtitle">
          可以提及希望增加的竞赛类型支持、对现有奖励方式的改进想法，或是关于参赛流程简化、培训指导加强等内容
        </p>
        <FloatLabel variant="on" class="mt-4">
          <Textarea v-model="state.advice" rows="5" autoResize fluid />
          <label>建议</label>
        </FloatLabel>
      </Fieldset>
      <Fieldset legend="提交问卷" v-if="participatedVerify">
        <h3>
          <span class="text-bold">Congratulations!</span>
          感谢你的填答，但我们还需要一点额外的工作
        </h3>
        <p class="subtitle">
          请<span class="highlight">全选</span>复制下方的填答结果并在随后内嵌的
          <span class="highlight">Microsoft Forms</span> 中粘贴提交
        </p>
        <p class="highlight">问卷结果使用非对称加密技术保护，您的填答结果不会被第三方使用，给您带来的不便敬请谅解！</p>
        <FloatLabel variant="on" class="mt-4">
          <Textarea v-model="stateResult" rows="5" fluid />
          <label>填答结果</label>
        </FloatLabel>

        <iframe height="480px"
          src="https://forms.office.com/Pages/ResponsePage.aspx?id=DQSIkWdsW0yxEjajBLZtrQAAAAAAAAAAAAO__Q331eFUNkVMS0xYWVZZRjBHWEJVRjY0SUxJTE1TOS4u&embed=true"
          frameborder="0" marginwidth="0" marginheight="0" class="card mt-4 w-full" style="padding: 0" allowfullscreen
          webkitallowfullscreen mozallowfullscreen msallowfullscreen>
        </iframe>
      </Fieldset>
    </Panel>
  </main>
</template>

<style scoped>
header {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 4rem;
  padding: 0 2rem;
  transition:
    background-color 0.5s,
    border-color 0.5s;
  z-index: 1000;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(0, 0, 0, 0);
}

nav {
  width: 100%;
  height: 100%;
  max-width: 1080px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
}

nav a {
  display: flex;
  align-items: center;
  text-decoration: none;
}

nav a img {
  height: 1.5rem;
}

nav a span {
  margin-left: 0.5rem;
  font-weight: 800;
}

.layout-content {
  display: flex;
  padding: 6rem 4rem 1rem;
  flex-direction: column;
}

@media screen and (min-width: 1080px) {

  .layout-content,
  .layout-footer,
  .layout-topbar-inner {
    margin: 0 auto;
    max-width: 960px;
  }

  header {
    position: fixed;
  }

  header:not(.top) {
    background-color: white;
    border-bottom: 1px solid var(--p-fieldset-border-color);
  }

  header.top nav a span {
    background-color: var(--p-primary-color);
    background-image: none;
  }
}

@media screen and (max-width: 1080px) {

  .layout-content,
  .layout-footer {
    padding-left: 2rem;
    padding-right: 2rem;
  }
}

@media screen and (max-width: 575px) {

  .layout-content,
  .layout-footer {
    padding-left: 1rem;
    padding-right: 1rem;
  }
}

.title {
  font-weight: 800;
  margin: 2rem auto 0;
}

.clip {
  background: -webkit-linear-gradient(140deg, var(--p-primary-color) 54%, #a31234 68%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 0.9rem;
  color: #666;
}

.highlight {
  color: var(--p-primary-color);
  font-weight: bold;
}
</style>
