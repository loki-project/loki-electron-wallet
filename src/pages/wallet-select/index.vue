<template>
  <q-page>
    <q-list class="wallet-list" link no-border :dark="theme == 'dark'">
      <template v-if="wallet_list.length">
        <div class="header row justify-between items-center">
          <div class="header-title">
            {{ $t("titles.yourWallets") }}
          </div>
          <q-btn
            v-if="wallets.list.length"
            class="add"
            icon="add"
            size="md"
            color="primary"
          >
            <q-menu class="header-popover" :content-class="'header-popover'">
              <q-list separator>
                <q-item
                  v-for="action in actions"
                  :key="action.name"
                  clickable
                  @click.native="action.handler"
                >
                  <q-item-section>
                    {{ action.name }}
                  </q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
        <div class="hr-separator" />
        <!-- Hardware wallets -->
        <q-list-header v-if="hardware_wallets.length">{{
          $t("strings.hardwareWallets")
        }}</q-list-header>
        <WalletListItem
          v-for="wallet in hardware_wallets"
          :key="`${wallet.address}-${wallet.name}`"
          :wallet="wallet"
          :open-wallet="openWallet"
        />
        <!-- Regular wallets -->
        <q-list-header v-if="hardware_wallets.length">{{
          $t("strings.regularWallets")
        }}</q-list-header>
        <WalletListItem
          v-for="wallet in regular_wallets"
          :key="`${wallet.address}-${wallet.name}`"
          :wallet="wallet"
          :open-wallet="openWallet"
        />

        <q-item-separator />
      </template>
      <template v-else>
        <q-item
          v-for="action in actions"
          :key="action.name"
          @click.native="action.handler"
        >
          <q-item-section>
            {{ action.name }}
          </q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-page>
</template>

<script>
import { mapState } from "vuex";
import WalletListItem from "components/wallet_list_item";

export default {
  components: {
    WalletListItem
  },
  computed: mapState({
    theme: state => state.gateway.app.config.appearance.theme,
    wallets: state => state.gateway.wallets,
    wallet_list: state => state.gateway.wallets.list,
    status: state => state.gateway.wallet.status,
    hardware_wallets() {
      return this.wallet_list.filter(w => w.hardware_wallet);
    },
    regular_wallets() {
      return this.wallet_list.filter(w => !w.hardware_wallet);
    },
    actions() {
      // TODO: Add this in once LOKI has the functionality
      // <q-item @click.native="restoreViewWallet()">
      //     <q-item-label label="Restore view-only wallet" />
      // </q-item>
      const actions = [
        {
          name: this.$t("titles.wallet.createNew"),
          handler: this.createNewWallet
        },
        {
          name: this.$t("titles.wallet.restoreFromSeed"),
          handler: this.restoreWallet
        },
        {
          name: this.$t("titles.wallet.importFromFile"),
          handler: this.importWallet
        }
      ];

      if (this.wallets.directories.length > 0) {
        actions.push({
          name: this.$t("titles.wallet.importFromOldGUI"),
          handler: this.importOldGuiWallets
        });
      }

      return actions;
    }
  }),
  watch: {
    status: {
      handler(val, old) {
        if (val.code == old.code) return;
        const { code, message } = val;
        switch (code) {
          case 0: // Wallet loaded
            this.$q.loading.hide();
            this.$router.replace({ path: "/wallet" });
            break;
          case -1: // Error
          case -22:
            this.$q.loading.hide();
            this.$q.notify({
              type: "negative",
              timeout: 1000,
              message
            });
            this.$store.commit("gateway/set_wallet_data", {
              status: {
                code: 1 // Reset to 1 (ready for action)
              }
            });
            break;
        }
      },
      deep: true
    }
  },
  created() {
    this.$gateway.send("wallet", "list_wallets");
  },
  methods: {
    openWallet(wallet) {
      if (wallet.password_protected !== false) {
        this.$q
          .dialog({
            title: this.$t("dialog.password.title"),
            message: this.$t("dialog.password.message"),
            prompt: {
              model: "",
              type: "password"
            },
            ok: {
              label: this.$t("dialog.buttons.open"),
              color: "primary"
            },
            cancel: {
              flat: true,
              label: this.$t("dialog.buttons.cancel")
            },
            color: "#1F1C47",
            persistent: true
          })
          .onOk(password => {
            this.$q.loading.show({
              delay: 0
            });
            this.$gateway.send("wallet", "open_wallet", {
              name: wallet.name,
              password: password
            });
          })
          .onCancel(() => {})
          .onDismiss(() => {});
      } else {
        this.$q.loading.show({
          delay: 0
        });
        this.$gateway.send("wallet", "open_wallet", {
          name: wallet.name,
          password: ""
        });
      }
    },
    createNewWallet() {
      this.$router.replace({ path: "wallet-select/create" });
    },
    restoreWallet() {
      this.$router.replace({ path: "wallet-select/restore" });
    },
    restoreViewWallet() {
      this.$router.replace({ path: "wallet-select/import-view-only" });
    },
    importWallet() {
      this.$router.replace({ path: "wallet-select/import" });
    },
    importOldGuiWallets() {
      this.$router.replace({ path: "wallet-select/import-old-gui" });
    },
    importLegacyWallet() {
      this.$router.replace({ path: "wallet-select/import-legacy" });
    }
  }
};
</script>

<style lang="scss">
.wallet-list {
  .wallet-icon {
    font-size: 3rem;
  }

  .header {
    margin: 0 16px;
    padding: 6px;
    min-height: 36px;

    .header-title {
      font-size: 14px;
      font-weight: 500;
    }

    .add {
      width: 38px;
      padding: 0;
    }
  }
  .wallet-name {
    font-size: 1.1rem;
  }
  .q-item {
    margin: 10px 16px;
    margin-bottom: 0px;
    padding: 14px;
    border-radius: 3px;
  }
}
</style>
