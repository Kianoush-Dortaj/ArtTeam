#![cfg_attr(not(feature = "std"), no_std)]

use frame_support::debug;
use frame_support::pallet_prelude::Member;
use frame_support::sp_runtime::traits::{
	AtLeast32BitUnsigned, CheckedAdd, MaybeSerializeDeserialize, One, Zero,
};
use frame_support::traits::Randomness;
use frame_support::{
	inherent::Vec, pallet_prelude::*, sp_runtime::traits::Hash, traits::Currency,
	traits::ExistenceRequirement, transactional,
};

use frame_support::{Parameter, Twox64Concat};
use frame_system::pallet_prelude::*;
/// Edit this file to define custom logic or remove it if it is not needed.
/// Learn more about FRAME and the core library of Substrate FRAME pallets:
/// <https://docs.substrate.io/reference/frame-pallets/>
pub use pallet::*;

pub type BalanceOf<T> =
	<<T as Config>::Currency as Currency<<T as frame_system::Config>::AccountId>>::Balance;
#[frame_support::pallet]
pub mod pallet {

	use core::fmt;

	use super::*;

	#[derive(Clone, Encode, Decode, PartialEq, RuntimeDebug, TypeInfo)]
	#[scale_info(skip_type_params(T))]
	#[codec(mel_bound())]
	pub struct BusinessInfo<T: Config> {
		logo: Vec<u8>,
		storeId: <T as frame_system::Config>::Hash,
		owner: <T as frame_system::Config>::AccountId,
		description: Vec<u8>,
		name: Vec<u8>,
	}

	#[derive(Clone, Encode, Decode, PartialEq, RuntimeDebug, TypeInfo)]
	#[scale_info(skip_type_params(T))]
	#[codec(mel_bound())]
	pub struct BusinessItem<T: Config> {
		media: Vec<u8>,
		title: Vec<u8>,
		description: Vec<u8>,
		price: u32,
		count: u32,
		itemId: <T as frame_system::Config>::Hash,
	}

	#[derive(Clone, Encode, Decode, PartialEq, RuntimeDebug, TypeInfo)]
	#[scale_info(skip_type_params(T))]
	#[codec(mel_bound())]
	pub struct Basket<T: Config> {
		itemId: <T as frame_system::Config>::Hash,
		items: Vec<UserBasketItemItem<T>>,
		basketOwner: T::AccountId,
		customerPay: bool,
		confirmPay: bool,
	}

	#[derive(Clone, Encode, Decode, PartialEq, RuntimeDebug, TypeInfo)]
	#[scale_info(skip_type_params(T))]
	#[codec(mel_bound())]
	pub struct UserTransationHistory<T: Config> {
		transactionId: <T as frame_system::Config>::Hash,
		items: Vec<UserBasketItemItem<T>>,
		customerPay: bool,
		confirmPay: bool,
		storeOwner: T::AccountId,
		storeId: <T as frame_system::Config>::Hash,
	}

	#[derive(Clone, Encode, Decode, PartialEq, RuntimeDebug, TypeInfo)]
	#[scale_info(skip_type_params(T))]
	#[codec(mel_bound())]
	pub struct UserBasketItemItem<T: Config> {
		itemId: <T as frame_system::Config>::Hash,
		count: u32,
		price: u32,
	}

	/// Configure the pallet by specifying the parameters and types on which it depends.
	#[pallet::config]
	pub trait Config: frame_system::Config {
		type Event: From<Event<Self>> + IsType<<Self as frame_system::Config>::Event>;
		type BusinessId: Parameter + Member + AtLeast32BitUnsigned + Default + Copy;
		type Randomness: Randomness<Self::Hash, Self::BlockNumber>;
		type MaxNameLenght: Get<u32>;
		type MinNameLenght: Get<u32>;
		type Currency: Currency<Self::AccountId>;
	}

	#[pallet::pallet]
	#[pallet::generate_store(pub(super) trait Store)]
	#[pallet::without_storage_info]
	pub struct Pallet<T>(_);

	#[pallet::storage]
	#[pallet::getter(fn something)]
	pub type Something<T> = StorageValue<_, u32>;

	#[pallet::storage]
	#[pallet::getter(fn nounce)]
	pub type Nonce<T: Config> = StorageValue<_, u32>;

	#[pallet::storage]
	#[pallet::getter(fn businesss)]
	pub(super) type Business<T: Config> =
		StorageMap<_, Twox64Concat, T::AccountId, BusinessInfo<T>>;

	#[pallet::storage]
	#[pallet::getter(fn items)]
	pub(super) type Items<T: Config> =
		StorageMap<_, Twox64Concat, T::AccountId, Vec<BusinessItem<T>>>;

	#[pallet::storage]
	#[pallet::getter(fn baskets)]
	pub(super) type Baskets<T: Config> =
		StorageMap<_, Twox64Concat, <T as frame_system::Config>::Hash, Basket<T>>;

	#[pallet::storage]
	#[pallet::getter(fn userTransactions)]
	pub(super) type UserTransactions<T: Config> =
		StorageMap<_, Twox64Concat, T::AccountId, UserTransationHistory<T>>;

	// Pallets use events to inform users when important changes are made.
	// https://docs.substrate.io/main-docs/build/events-errors/
	#[pallet::event]
	#[pallet::generate_deposit(pub(super) fn deposit_event)]
	pub enum Event<T: Config> {
		/// Event documentation should end with an array that provides descriptive names for event
		/// parameters. [something, who]
		SomethingStored(u32, T::AccountId),
		BusinessCreated(Option<<T as frame_system::Config>::Hash>),
		ItemCreated(Option<<T as frame_system::Config>::Hash>),
		BasketItemCreated(<T as frame_system::Config>::Hash),
	}

	// Errors inform users that something went wrong.
	#[pallet::error]
	pub enum Error<T> {
		/// Error names should be descriptive.
		NoneValue,
		/// Errors should have helpful documentation associated with them.
		StorageOverflow,
		StoreNameTooManyBytes,
		StoreNameEnoughBytes,
		StoreItemNotFound,
		StoreNoFound,
		BasketNotFound,
		InsufficientBalance,
	}

	// Dispatchable functions allows users to interact with the pallet and invoke state changes.
	// These functions materialize as "extrinsics", which are often compared to transactions.
	// Dispatchable functions must be annotated with a weight and must return a DispatchResult.
	#[pallet::call]
	impl<T: Config> Pallet<T> {
		#[pallet::weight(10000)]
		#[transactional]
		pub fn register_store(
			origin: OriginFor<T>,
			name: Vec<u8>,
			description: Vec<u8>,
			logo: Vec<u8>,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;

			ensure!(
				(name.len() as u32) < T::MaxNameLenght::get(),
				<Error<T>>::StoreNameTooManyBytes
			);

			ensure!(
				(name.len() as u32) > T::MinNameLenght::get(),
				<Error<T>>::StoreNameEnoughBytes
			);

			let store_id = T::Hashing::hash_of(&logo.clone());

			let store_info = BusinessInfo {
				name: name.clone(),
				logo: logo.clone(),
				description: description.clone(),
				owner: who.clone(),
				storeId: store_id,
			};

			<Business<T>>::insert(who.clone(), store_info);

			// let store_item_vec: Vec<BusinessItem> = Vec::new();
			// <Items<T>>::insert(None, who.clone(), store_item_vec);

			Self::deposit_event(Event::BusinessCreated(Some(store_id)));

			Ok(())
		}

		#[pallet::weight(10000)]
		#[transactional]
		pub fn add_item(
			origin: OriginFor<T>,
			media: Vec<u8>,
			title: Vec<u8>,
			description: Vec<u8>,
			price: u32,
			count: u32,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;

			let item_id = T::Hashing::hash_of(&media.clone());

			let _itemInfo = Self::items(&who.clone());
			match _itemInfo {
				None => {
					let item_info = BusinessItem {
						media: media.clone(),
						title: title.clone(),
						description: description.clone(),
						price: price.clone(),
						count: count.clone(),
						itemId: item_id,
					};
					let mut add_item: Vec<BusinessItem<T>> = Vec::new();

					add_item.push(item_info);
					<Items<T>>::insert(who.clone(), &add_item);
				},

				Some(mut item) => {
					let item_info = BusinessItem {
						media: media.clone(),
						title: title.clone(),
						description: description.clone(),
						price: price.clone(),
						count: count.clone(),
						itemId: item_id,
					};

					&item.push(item_info);
					<Items<T>>::insert(who.clone(), &item);
				},
			}

			Self::deposit_event(Event::ItemCreated(Some(item_id)));

			Ok(())
		}

		#[pallet::weight(10000)]
		#[transactional]
		pub fn add_store_owner_to_basket(
			origin: OriginFor<T>,
			item_id: <T as frame_system::Config>::Hash,
			count_item: u32,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;
			let mut storeId: <T as frame_system::Config>::Hash;

			let storeInfo = Self::businesss(&who.clone()).ok_or(<Error<T>>::StoreNoFound)?;

			storeId = storeInfo.storeId;

			let items: Vec<BusinessItem<T>> =
				Self::items(&who.clone()).ok_or(<Error<T>>::StoreItemNotFound)?;

			let _itemInfo: Option<&BusinessItem<T>> =
				items.iter().find(|item| item.itemId == item_id);

			match _itemInfo {
				None => {
					Err::<T, ()>(());
				},

				Some(item) => {
					let user_basket_item = UserBasketItemItem {
						itemId: item_id,
						price: item.price,
						count: count_item,
					};

					let basketItem = Self::baskets(&storeId);

					match basketItem {
						None => {
							let mut add_item: Vec<UserBasketItemItem<T>> = Vec::new();
							add_item.push(user_basket_item);

							let store_basket = Basket {
								itemId: T::Hashing::hash_of(&add_item),
								confirmPay: false,
								customerPay: false,
								basketOwner: who.clone(),
								items: add_item,
							};

							<Baskets<T>>::insert(storeId, &store_basket);
							Self::deposit_event(Event::BasketItemCreated(store_basket.itemId))
						},
						Some(mut basketItem) => {
							basketItem.items.push(user_basket_item);
							<Baskets<T>>::insert(storeId, &basketItem);
							Self::deposit_event(Event::BasketItemCreated(basketItem.itemId))
						},
					}
				},
			}

			Ok(())
		}

		#[pallet::weight(10000)]
		#[transactional]
		pub fn payBasket(
			origin: OriginFor<T>,
			storeId: <T as frame_system::Config>::Hash,
		) -> DispatchResult {
			let who = ensure_signed(origin)?;

			Baskets::<T>::mutate(storeId, |basket| -> DispatchResult {
				match basket {
					Some(basket) => {
						let mut total_price = 0;
						total_price = basket.items.iter().map(|x| x.price * x.count).sum();
						log::info!("**************** Total Price {:?}", total_price);
						// let fff = total_price as u64;
						let total_cost: BalanceOf<T> = total_price.into();

						T::Currency::transfer(
							&who.clone(),
							&basket.basketOwner,
							total_cost,
							ExistenceRequirement::KeepAlive,
						)?;

						let transactionHistory = UserTransationHistory {
							transactionId: T::Hashing::hash_of(&who.clone()),
							items: basket.items.clone(),
							customerPay: true,
							confirmPay: true,
							storeOwner: basket.basketOwner.clone(),
							storeId,
						};

						<UserTransactions<T>>::insert(&who.clone(), &transactionHistory);
						<UserTransactions<T>>::insert(&basket.basketOwner, &transactionHistory);

						Baskets::<T>::remove(storeId);

						Ok(())
					},
					_ => Err(<Error<T>>::StoreItemNotFound.into()),
				}
			});

			Ok(())
		}
	}
}

impl<T: Config> Pallet<T> {
	// Note the warning above about saturated conversions

	// fn get_and_increment_nonce() -> Vec<u8> {
	// 	let nonce = Nonce::<T>::get();
	// 	let no = Some(nonce);
	// 	Nonce::<T>::put(Some(nonce).wrapping_add(1));
	// 	nonce.encode()
	// }

	// fn gen_random() -> <T as frame_system::Config>::Hash {
	// 	let nonce = Self::get_and_increment_nonce();
	// 	let (randomValue, _) = T::Randomness::random(&nonce);
	// 	return randomValue;
	// }
}
