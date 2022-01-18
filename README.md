# vuex4现状
Vue.js于2020-09-18发布`3.0`版本。Vuex于2020-03-15发布`4.0-alpha.1`版本，至2021-06-17发布`4.0.2`版本，Vuex已经有好几个月没有发新版了。我从2020年下旬开始在公司中尝试使用一整套Vue3生态 + TypeScript开发项目，算是比较早的使用者了，简单说下我的使用感受。

Vue3本身加其它几个核心库用起来很丝滑。如果不使用TypeScript的话，vuex4也没啥大毛病，但是一旦用上TypeScript，就难受起来了。Vuex4的TypeScript类型体验我只想用一个字来形容：**拉胯，拉的一**。究其原因，Vuex4源码仍然是使用js开发的，只是向外暴露了types类型声明，而且类型声明还是阉割的，仅仅在`types/index.d.ts`中我就搜索到了22个`any`。这就导致如果你想享受Vuex4的类型提示的话，你必须自己额外写非常非常冗长的模板代码来补全这被阉割的类型。

我知道你可能看过[You Might Not Need Vuex with Vue 3](https://dev.to/vuesomedev/you-might-not-need-vuex-with-vue-3-52e4)这篇文章，然后说Vue3不需要Vuex。的确，简单场景下，这没问题。但是这也意味着你无法享受devtools扩展带来的调试的便利。另外，你无法在`setup`函数外使用你的响应式状态，试想一个场景：当你想在axios的请求拦截器中获取你响应式状态的用户`token`，是不是就抓瞎了？

实际上Vuex官方也清楚现在存在的问题，所以2021年3月2日[kiaking](https://github.com/kiaking)就提交了一个PR:[Vuex5的提案](https://github.com/vuejs/rfcs/pull/271)。不知道为什么，现在vue的[rfcs列表](https://github.com/vuejs/rfcs/tree/master/active-rfcs)里我找不到这个rfc了，但是通过上面PR链接里的[commit记录](https://github.com/vuejs/rfcs/pull/271/commits/f5e074eda414d48b0b4fc4947afc1889e03a6c4e#diff-fff40c308b74ba26c38a21bd9e50b349ded7e3781660bb7612661cc7c2ebd9f2)我们仍然可以看到这条rfc的具体内容，感兴趣的可以看一下。

# Pinia

说了那么多，那么在Vuex5发布之前，我们要怎么愉快地组织我们的状态管理呢？试试[Pinia](https://pinia.esm.dev/)吧。Pinia本来是为了测试Vuex5提案而出现的，它的作者是Vue.js核心团队的成员，现在它不但支持Vue3也支持Vue2的options API，不过我只用在Vue3中，所以今天不讲options API的用法。虽然它现在的API和Vuex比较像，但是和Vuex相比，它还是又很多明显的不同之处的：

- `mutations`很啰嗦所以移除了，现在只有`actions`，一开始加入`mutations`这个概念也只是为了在devtools中明确记录状态变化。
- Pinia源码使用TypeScript开发，不需要像现在Vuex一样写一堆模板代码来支持类型推断。
- Vuex有很多魔法字符串，比如`$store.dispatch('user/login')`，这些魔法字符串都是天生TypeScript不友好的。在Pinia里都变成了函数调用，类型推断友好：`store.login()`。
- Vuex一般是应用初始化的时候就在`main.js`里把`store`一次性注册好了，Pinia是你什么时候调用某个`store`才会在那个时刻创建。
- 不再需要命名空间和模块嵌套了，比如以前Vuex里你划分了`user`和`app`这两个模块，通过人为约定的字符串来划分命名空间。现在只需要为这两个模块创建两个独立的文件，分别导出各自的`store`变量，这已经达到命名空间的目的了。

## 基本用法

关于Pinia的用法，我不会把官网翻译一遍，把所有知识点都罗列一遍，那实在没有意义，我只会把基本用法说一下，把容易忽略的点和容易踩坑的点指出来。为此我创建了一个[仓库](https://github.com/nikolausliu/pinia-guide)，并使用不同的分支来管理代码，感兴趣的可以查看。

首先要注册Pinia实例，并将实例挂载到app上：

```ts
// store/index.ts
import { createPinia } from 'pinia'
export const pinia = createPinia()
```

```ts
// main.ts
import { createApp } from 'vue'
import App from './App.vue'
import { pinia } from './store'

createApp(App).use(pinia).mount('#app')

```

pinia实例挂载后，就是定义你的一个个`store`了，为了更好的组织代码，你可以一个`store`对应一个文件。

Pinia定义store有两种风格的写法，第一种风格的写法官网只粗略的一带而过，如果你不仔细看，可能都注意不到还能这么写：

### composition API风格写法

> 该风格的代码可以在我[composition-api分支](https://github.com/nikolausliu/pinia-guide/tree/composition-api)下找到源码

```ts
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
export const useCounterStore = defineStore('counter', () => {
  // state
  const count = ref(0)

  // getters
  const double = computed(() => dount.value * 2)

  // actions
  function increment() {
    count.value++
  }

  return { count, double, increment }
})
```

在组件里使用：

```ts
import { useCounterStore } from '@/stores/counter'

export default {
  setup() {
    const counter = useCounterStore()

    counter.count++
    counter.double // 2
    // with autocompletion ✨
    counter.$patch({ count: counter.count + 1 })
    // or using an action instead
    counter.increment()
  },
}
```

这种方式就和我们平时写composition API没啥区别，不过官方只花了很少的篇幅介绍了这种写法，而且这种写法貌似无法配置Pinia的plugin，所以后面主要说第二种用法。

### 常用的写法

> 该风格的代码可以在我[vuex-style分支](https://github.com/nikolausliu/pinia-guide/tree/vuex-style)下找到源码

```javascript
import { defineStore } from 'pinia'
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    }
  },
})
```

这种风格的写法比较贴近于Vuex的写法。

### 插件

Pinia还提供了插件API，插件API能做很多事，但是回想一下在使用Vuex时你最常用的插件是不是就是`vuex-persist`？没错，Pinia也提供了这样的能力。

首先需要定义一个plugin，它是一个函数:

```ts
// /store/plugins/piniaPersist.ts
export function piniaPersist(context) {
  context.pinia // the pinia created with `createPinia()`
  context.app // the current app created with `createApp()` (Vue 3 only)
  context.store // the store the plugin is augmenting
  context.options // the options object defining the store passed to `defineStore()`
  // ...
}
```

然后需要注册这个plugin:

```ts
import { createPinia } from 'pinia'
import piniaPersist from './plugins/piniaPersist'

export const pinia = createPinia()
pinia.use(piniaPersist)
```

plugin的内容我直接用了[pinia-plugin-persist](https://github.com/Seb-L/pinia-plugin-persist)这个库，不过这个库还处于开发阶段，我使用的时候发现它依赖的Pinia版本还处在0.x，与我当时使用的2.x版本不兼容，所以修改了部分代码放在本地来维护，内容如下：

```ts
import { watch } from 'vue'
import { PiniaPluginContext } from 'pinia'
import type { StateTree, _GettersTree } from 'pinia'

export interface PersistStrategy {
  key?: string
  storage?: Storage
  paths?: string[]
}

export interface PersistOptions {
  enabled: true
  strategies?: PersistStrategy[]
}

type Store = PiniaPluginContext['store']
type PartialState = Partial<Store['$state']>

declare module 'pinia' {
  export interface DefineStoreOptions<
    Id extends string,
    S extends StateTree,
    G extends _GettersTree<S>,
    A
  > {
    persist?: PersistOptions
  }
}

const updateStorage = (strategy: PersistStrategy, store: Store) => {
  const storage = strategy.storage || sessionStorage
  const storeKey = strategy.key || store.$id

  if (strategy.paths) {
    const partialState = strategy.paths.reduce((finalObj, key) => {
      finalObj[key] = store.$state[key]
      return finalObj
    }, {} as PartialState)

    storage.setItem(storeKey, JSON.stringify(partialState))
  } else {
    storage.setItem(storeKey, JSON.stringify(store.$state))
  }
}

export default ({ options, store }: PiniaPluginContext) => {
  if (options.persist?.enabled) {
    const defaultStrat: PersistStrategy[] = [
      {
        key: store.$id,
        storage: sessionStorage,
      },
    ]

    const strategies = options.persist?.strategies?.length
      ? options.persist?.strategies
      : defaultStrat

    strategies.forEach((strategy) => {
      const storage = strategy.storage || sessionStorage
      const storeKey = strategy.key || store.$id
      const storageResult = storage.getItem(storeKey)

      if (storageResult) {
        store.$patch(JSON.parse(storageResult))
        updateStorage(strategy, store)
      }
    })

    watch(
      () => store.$state,
      () => {
        strategies.forEach((strategy) => {
          updateStorage(strategy, store)
        })
      },
      {
        deep: true,
        immediate: true,
      }
    )
  }
}

```

用法是在定义store的时候添加一个`persist`属性：

```ts
import { defineStore } from 'pinia'
export const useCounterStore = defineStore('counter', {
  state: () => ({ count: 0 }),
  getters: {
    double: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
  },
  persist: {
    enabled: true,
    strategies: [
      {
        storage: localStorage,
        key: 'PINIA_COUNTER',
      },
    ],
  },
})
```
> 持久化部分的源码可以在我[plugin分支](https://github.com/nikolausliu/pinia-guide/tree/plugin)下找到源码。
