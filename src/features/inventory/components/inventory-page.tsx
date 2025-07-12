"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { InventoryLayout, InventoryHeader } from './inventory-layout'
import { PlatformSignBrowser } from './platform-sign-browser'
import { MyInventoryList } from './my-inventory-list'
import { CustomSignUploadForm } from './custom-sign-upload-form'
import { BundleCreator } from './bundle-creator'
import { Plus, Package, Upload, Library } from 'lucide-react'
import { useToast } from '@/shared/components/feedback/toast'
import { 
  getPlatformSignLibrary, 
  getAgencyInventory, 
  getCustomSigns,
  getBundles
} from '../actions'
import type { InventoryTab, Sign, InventoryItem } from '../types'

interface InventoryPageProps {
  initialTab?: InventoryTab
}

export function InventoryPage({ initialTab = 'library' }: InventoryPageProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<InventoryTab>(initialTab)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [showBundleCreator, setShowBundleCreator] = useState(false)
  
  // Data state
  const [platformSigns, setPlatformSigns] = useState<Sign[]>([])
  const [agencyInventory, setAgencyInventory] = useState<InventoryItem[]>([])
  const [customSigns, setCustomSigns] = useState<Sign[]>([])
  const [bundles, setBundles] = useState<any[]>([])
  
  // Loading states
  const [isLoadingPlatform, setIsLoadingPlatform] = useState(false)
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  const [isLoadingCustom, setIsLoadingCustom] = useState(false)
  const [isLoadingBundles, setIsLoadingBundles] = useState(false)

  // Load data based on active tab
  useEffect(() => {
    const loadTabData = async () => {
      try {
        switch (activeTab) {
          case 'library':
            if (platformSigns.length === 0) {
              setIsLoadingPlatform(true)
              const signs = await getPlatformSignLibrary()
              setPlatformSigns(signs)
              setIsLoadingPlatform(false)
            }
            break
            
          case 'inventory':
            if (agencyInventory.length === 0) {
              setIsLoadingInventory(true)
              const inventory = await getAgencyInventory()
              setAgencyInventory(inventory)
              setIsLoadingInventory(false)
            }
            break
            
          case 'custom':
            if (customSigns.length === 0) {
              setIsLoadingCustom(true)
              const signs = await getCustomSigns()
              setCustomSigns(signs)
              setIsLoadingCustom(false)
            }
            break
            
          case 'bundles':
            if (bundles.length === 0) {
              setIsLoadingBundles(true)
              const bundleData = await getBundles()
              setBundles(bundleData)
              setIsLoadingBundles(false)
            }
            break
        }
      } catch (error) {
        console.error(`Error loading ${activeTab} data:`, error)
        toast({ variant: 'error', title: `Failed to load ${activeTab} data` })
      }
    }

    loadTabData()
  }, [activeTab, platformSigns.length, agencyInventory.length, customSigns.length, bundles.length])

  const handleTabChange = (tab: InventoryTab) => {
    setActiveTab(tab)
    setShowUploadForm(false)
    setShowBundleCreator(false)
  }

  const handleCustomSignUploadSuccess = (signId: string) => {
    setShowUploadForm(false)
    toast({ variant: 'success', title: 'Custom sign uploaded successfully!' })
    // Refresh custom signs
    setCustomSigns([])
    setActiveTab('custom')
  }

  const handleBundleCreateSuccess = (bundleId: string) => {
    setShowBundleCreator(false)
    toast({ variant: 'success', title: 'Bundle created successfully!' })
    // Refresh bundles
    setBundles([])
    setActiveTab('bundles')
  }

  const getTabContent = () => {
    // Show upload form if requested
    if (showUploadForm) {
      return (
        <div>
          <InventoryHeader
            title="Upload Custom Sign"
            description="Add your own custom signs to the inventory"
          />
          <CustomSignUploadForm
            onSuccess={handleCustomSignUploadSuccess}
            onCancel={() => setShowUploadForm(false)}
          />
        </div>
      )
    }

    // Show bundle creator if requested
    if (showBundleCreator) {
      return (
        <div>
          <InventoryHeader
            title="Create Sign Bundle"
            description="Group signs together for themed displays"
          />
          <BundleCreator
            onSuccess={handleBundleCreateSuccess}
            onCancel={() => setShowBundleCreator(false)}
          />
        </div>
      )
    }

    // Show tab-specific content
    switch (activeTab) {
      case 'library':
        return (
          <div>
            <InventoryHeader
              title="Sign Library"
              description="Browse and add signs from the platform library to your inventory"
              action={
                <Button
                  onClick={() => setActiveTab('inventory')}
                  variant="secondary"
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  View My Inventory
                </Button>
              }
            />
            <PlatformSignBrowser 
              initialSigns={isLoadingPlatform ? [] : platformSigns}
            />
          </div>
        )

      case 'inventory':
        return (
          <div>
            <InventoryHeader
              title="My Inventory"
              description="Manage your sign inventory quantities and track availability"
              action={
                <div className="flex gap-2">
                  <Button
                    onClick={() => setActiveTab('library')}
                    variant="secondary"
                    className="flex items-center gap-2"
                  >
                    <Library className="h-4 w-4" />
                    Browse Library
                  </Button>
                  <Button
                    onClick={() => setShowUploadForm(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Custom Sign
                  </Button>
                </div>
              }
            />
            <MyInventoryList 
              initialInventory={isLoadingInventory ? [] : agencyInventory}
            />
          </div>
        )

      case 'custom':
        return (
          <div>
            <InventoryHeader
              title="Custom Signs"
              description="Manage your custom uploaded signs unique to your agency"
              action={
                <Button
                  onClick={() => setShowUploadForm(true)}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Custom Sign
                </Button>
              }
            />
            {isLoadingCustom ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-neutral-200 animate-pulse rounded-lg h-64"></div>
                ))}
              </div>
            ) : (
              <PlatformSignBrowser 
                initialSigns={customSigns}
              />
            )}
          </div>
        )

      case 'bundles':
        return (
          <div>
            <InventoryHeader
              title="Sign Bundles"
              description="Manage themed collections of signs for complete displays"
              action={
                <Button
                  onClick={() => setShowBundleCreator(true)}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Create Bundle
                </Button>
              }
            />
            {isLoadingBundles ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-neutral-200 animate-pulse rounded-lg h-48"></div>
                ))}
              </div>
            ) : bundles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundles.map((bundle) => (
                  <div key={bundle.id} className="bg-white border border-neutral-200 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-neutral-900">{bundle.name}</h3>
                      <span className="text-sm text-neutral-500">
                        {bundle.signs?.length || 0} signs
                      </span>
                    </div>
                    {bundle.description && (
                      <p className="text-sm text-neutral-600 mb-4">{bundle.description}</p>
                    )}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {bundle.signs?.slice(0, 4).map((sign: Sign) => (
                        <div key={sign.id} className="relative aspect-square bg-neutral-100 rounded-lg overflow-hidden">
                          <img
                            src={sign.thumbnailUrl || sign.imageUrl}
                            alt={sign.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                      {bundle.signs?.length > 4 && (
                        <div className="aspect-square bg-neutral-200 rounded-lg flex items-center justify-center">
                          <span className="text-sm text-neutral-600">
                            +{bundle.signs.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                    <Button variant="secondary" className="w-full" size="sm">
                      View Bundle Details
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-16 w-16 text-neutral-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-neutral-900 mb-2">No bundles created yet</h3>
                <p className="text-neutral-600 mb-6">
                  Create your first bundle by grouping signs for themed displays.
                </p>
                <Button
                  onClick={() => setShowBundleCreator(true)}
                  className="flex items-center gap-2"
                >
                  <Package className="h-4 w-4" />
                  Create Your First Bundle
                </Button>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  return (
    <InventoryLayout
      activeTab={activeTab}
      onTabChange={handleTabChange}
    >
      {getTabContent()}
    </InventoryLayout>
  )
}